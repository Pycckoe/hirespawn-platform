<?php

namespace App\Jobs;

use App\Models\Subscription;
use App\Models\UserOauthToken;
use App\Services\Agents\RunRecorder;
use App\Services\Llm\LlmGateway;
use App\Services\Oauth\SlackClient;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Log;

/**
 * Handles a bot @-mention coming from Slack: figures out which buyer +
 * agent the channel belongs to, runs the agent on the message, and posts
 * the reply back into the thread.
 *
 * Dispatched via dispatchAfterResponse() so it runs in the same process
 * right after we ack Slack (within its 3s window) — no queue worker
 * required, which is the usual reason Slack replies never arrive.
 *
 * Routing: the buyer is the user who connected this workspace (team id ↔
 * UserOauthToken.account_id). The agent is whichever of that buyer's
 * subscriptions has this channel selected in its config (settings.routing
 * .slack.channel); falls back to the buyer's only Slack-routed agent.
 */
class HandleSlackMention
{
    use Dispatchable;

    public function __construct(
        public string $teamId,
        public string $channelId,
        public string $text,
        public ?string $threadTs = null,
    ) {}

    public function handle(LlmGateway $gateway, SlackClient $slack, RunRecorder $recorder): void
    {
        Log::info('[slack] handling mention', ['team' => $this->teamId, 'channel' => $this->channelId]);

        if ($this->teamId === '' || $this->channelId === '') {
            Log::warning('[slack] missing team/channel');

            return;
        }

        // 1. Which buyer connected this workspace?
        $token = UserOauthToken::query()
            ->where('provider', 'slack')
            ->where('account_id', $this->teamId)
            ->first();
        $buyer = $token?->user;
        if (! $buyer) {
            Log::warning('[slack] no buyer for team — is the workspace connected on Hirespawn?', ['team' => $this->teamId]);

            return;
        }

        // 2. Resolve the channel ID → "#name" and match a subscription.
        $channelName = $slack->channelName($buyer, $this->channelId);
        $subscription = $this->matchSubscription($buyer, $channelName);
        Log::info('[slack] routing', ['buyer' => $buyer->id, 'channelName' => $channelName, 'subscription' => $subscription?->id]);
        if (! $subscription) {
            $slack->postMessage($buyer, $this->channelId, "No agent is wired to this channel yet. Pick this channel in the agent's configuration on Hirespawn, then mention me again.", $this->threadTs);

            return;
        }

        $agent = $subscription->agent;
        if (! $agent?->llm_model_id) {
            $slack->postMessage($buyer, $this->channelId, "This agent isn't fully set up yet (no model assigned).", $this->threadTs);

            return;
        }

        // 3. Strip the <@BOTID> mention(s) to get the actual prompt.
        $prompt = trim(preg_replace('/<@[A-Z0-9]+>/i', '', $this->text) ?? '');
        if ($prompt === '') {
            $slack->postMessage($buyer, $this->channelId, "Hi! Mention me with a task, e.g. “@{$agent->name} summarise this thread”.", $this->threadTs);

            return;
        }

        // 4. Power check.
        $profile = $buyer->buyerProfile()->firstOrCreate([], []);
        $cost = (int) $agent->power_cost;
        if ($profile->power_balance < $cost) {
            $slack->postMessage($buyer, $this->channelId, "Not enough Power to run ({$cost}⚡ needed, {$profile->power_balance}⚡ left). Top up on Hirespawn.", $this->threadTs);

            return;
        }

        // 5. Run + record + reply.
        $response = $gateway->run($agent->fresh(['llmModel', 'seller', 'skills', 'settingDefs']), $prompt, $subscription);
        $recorder->record($subscription, $agent, $profile, $cost, $prompt, $response, source: 'slack');

        $reply = $response->ok
            ? ($response->text !== '' ? $response->text : '(the agent returned an empty response)')
            : "⚠️ Couldn't complete that: {$response->errorMessage}";

        $posted = $slack->postMessage($buyer, $this->channelId, $reply, $this->threadTs);
        Log::info('[slack] replied', ['ok' => $response->ok, 'posted' => $posted['ok'] ?? false, 'post_error' => $posted['error'] ?? null]);
    }

    /**
     * Find the subscription whose Slack routing channel matches the
     * mention. Matches by channel name (#name) first; if the channel can't
     * be resolved (e.g. private channel without groups:read), falls back to
     * the buyer's single Slack-routed subscription.
     */
    private function matchSubscription($buyer, ?string $channelName): ?Subscription
    {
        $slackRouted = $buyer->subscriptions()
            ->whereIn('status', ['active', 'paused'])
            ->with('agent')
            ->get()
            ->filter(fn (Subscription $sub) => ! empty($sub->settings['routing']['slack']['channel']));

        if ($channelName) {
            $target = strtolower(ltrim($channelName, '#'));
            $match = $slackRouted->first(function (Subscription $sub) use ($target) {
                $ch = $sub->settings['routing']['slack']['channel'];

                return strtolower(ltrim($ch, '#')) === $target;
            });
            if ($match) {
                return $match;
            }
        }

        // Fallback: exactly one Slack-routed agent → it's unambiguous.
        return $slackRouted->count() === 1 ? $slackRouted->first() : null;
    }
}
