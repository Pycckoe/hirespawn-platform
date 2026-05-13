<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Only is_admin users can sign into the Filament admin panel.
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return (bool) $this->is_admin;
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function sellerProfile(): HasOne
    {
        return $this->hasOne(SellerProfile::class);
    }

    public function buyerProfile(): HasOne
    {
        return $this->hasOne(BuyerProfile::class);
    }

    public function ownedAgents(): HasMany
    {
        return $this->hasMany(Agent::class, 'seller_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'buyer_id');
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class, 'seller_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'buyer_id');
    }

    public function apiKeys(): HasMany
    {
        return $this->hasMany(ApiKey::class);
    }

    public function workspaceMembers(): HasMany
    {
        return $this->hasMany(WorkspaceMember::class, 'owner_id');
    }

    public function payoutMethods(): HasMany
    {
        return $this->hasMany(PayoutMethod::class);
    }
}
