<?php

namespace App\Http\Controllers;

use App\Models\ApiClient;

class GuestTokenController extends Controller
{
    public function store()
    {
        $client = ApiClient::where('slug', 'public-web')->where('is_active', true)->firstOrFail();
        $expiresAt = now()->addMinutes(60);
        $token = $client->createToken('public-web', ['location:read'], $expiresAt);

        return response()->json([
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt->toIso8601String(),
            'abilities' => ['location:read'],
        ]);
    }
}
