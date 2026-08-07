<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !$this->validPassword($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Account is disabled.'], 403);
        }

        $expiresAt = now()->addHours(8);
        $token = $user->createToken('auth_token', ['location:read'], $expiresAt)->plainTextToken;

        $dsId = null;
        if ($user->isOfficer()) {
            $assignment = $user->activeDsAssignment()->with('divisionalSecretariat')->first();
            $dsId = $assignment?->divisional_secretariat_id;
        }

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt->toIso8601String(),
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
                'ds_id' => $dsId,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $dsId = null;
        if ($user->isOfficer()) {
            $assignment = $user->activeDsAssignment()->first();
            $dsId = $assignment?->divisional_secretariat_id;
        }

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
            'ds_id' => $dsId,
        ]);
    }

    private function validPassword(string $plainPassword, string $hashedPassword): bool
    {
        if (password_get_info($hashedPassword)['algoName'] !== 'bcrypt') {
            return false;
        }

        return Hash::check($plainPassword, $hashedPassword);
    }
}
