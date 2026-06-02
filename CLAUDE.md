# Hirespawn — project guide for Claude

AI agent marketplace. Buyers hire agents, configure them, chat, and connect
them to their own services (Slack, knowledge bases, MCP servers). Sellers
publish agents that run on the seller's own LLM API key.

## Stack
- Laravel 13 + Inertia v2 + React (Vite) front end.
- Filament v5 admin at `/admin`.
- Deployed on Laravel Cloud (`hirespawn-dev.laravel.cloud`).
- Work happens on branch `feature/wire-pages-to-db` (single branch — don't
  branch off it unless asked).

## CRITICAL: seeders run on every deploy
Laravel Cloud runs `db:seed` on **every deploy**. Therefore **seeders must
never clobber admin-/seller-editable data**. The rule:

- New row (lookup key missing) → insert full seed data.
- Existing row → **leave editable fields alone**. Only refresh truly
  immutable catalog metadata if you must, and never overwrite ownership,
  credentials, status, prompts, pricing, model assignment, etc.

Use one of these patterns, never a blind `updateOrCreate` of editable fields:
- `if (Model::where(key)->exists()) continue;` then `create(...)` — for fully
  editable records (e.g. `AgentSeeder`, `AgentTemplateSeeder`).
- Fetch existing, `forceFill([...immutable metadata only...])` — for catalog
  rows with a few safe-to-refresh fields (e.g. `OauthAppsSeeder`).
- Bail early if a marker field is set (e.g. `DemoAgentSeeder` returns when the
  agent already has `llm_model_id`).

Bugs caused by violating this rule (all fixed): OAuth creds wiped, power packs
diverging, an agent's reassigned `seller_id` reverting to the curator on
deploy (which also broke its LLM key resolution).

## No hardcode — everything via Filament admin
Settings, pricing, copy, ranks, languages, templates, OAuth apps, LLM models
etc. live in the DB and are edited in `/admin`. Don't hardcode values in
controllers or React. Read them from `SiteSetting::lookup()`, `Rates`, or the
relevant model.

## LLM gateway
- `App\Services\Llm\LlmGateway::run(Agent, prompt, ?Subscription)` runs an
  agent: resolves the model, the **agent owner's** `SellerLlmCredential` for
  that provider, renders `{{variables}}` into the system prompt, appends RAG
  knowledge, and drives the multi-turn tool-use loop.
- Drivers implement `Contracts\LlmDriver::complete(LlmRequest): LlmResponse`.
  Real drivers: `AnthropicDriver`, `OpenAiDriver`, `GoogleDriver` (Gemini via
  OpenAI-compatible endpoint). Unknown providers fall back to a stub error.
- Keys are per (seller, provider): `User::llmCredentialFor($provider)`.

## Money & data conventions
- Money is stored in **cents**.
- `languages` / `integrations` / `scopes` etc. are JSON array casts.
- Secrets encrypted with `Crypt::encryptString`.
- `public/build` and `composer.lock` are gitignored (rebuilt on deploy). Add
  PHP deps to `composer.json`; the lock regenerates on Laravel Cloud.

## After changing the front end
Run `npm run build` (assets are committed-by-deploy, not by us — but build to
catch JSX errors). Back-end-only changes need no build.

## Knowledge base (RAG)
Per-subscription `knowledge_sources` → chunked → embedded → `knowledge_chunks`
(embedding stored as JSON). `KnowledgeRetriever` ranks by cosine similarity in
PHP. Buyers can add knowledge to ANY rented agent (not vendor-gated).
Embeddings run on the **platform's own key** (`config('services.embeddings.key')`
← `EMBEDDINGS_API_KEY`, falls back to `OPENAI_API_KEY`) — it's our cost, sellers
configure nothing. `Embedder::platform()` / `Embedder::platformConfigured()`.

## MCP servers
Buyers connect remote (HTTP) MCP servers per subscription (`mcp_connections`);
their tools merge into the agent's catalogue at run time (`McpToolset` +
`McpClient`, namespaced `mcp_<conn>_<tool>`). Admin-curated catalog of popular
servers in `mcp_servers` (`/admin` → MCP servers) prefills the buyer's form.
