<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\OfficerDsAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function users()
    {
        return response()->json(
            User::query()
                ->with('activeDsAssignment.divisionalSecretariat')
                ->orderBy('role')
                ->orderBy('name')
                ->get()
        );
    }

    public function createUser(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:admin,officer',
            'ds_id'    => 'required_if:role,officer|nullable|integer|exists:divisional_secretariat,id',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        if ($request->role === 'officer' && $request->filled('ds_id')) {
            OfficerDsAssignment::create([
                'user_id'                    => $user->id,
                'divisional_secretariat_id'  => $request->ds_id,
                'is_active'                  => true,
            ]);
        }

        return response()->json(['message' => 'User created.', 'user' => $user->load('activeDsAssignment')], 201);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if (!$user->isOfficer()) {
            return response()->json(['message' => 'Only Divisional Secretary accounts can be edited here.'], 403);
        }

        $request->validate([
            'name'     => 'sometimes|string|max:255',
            'email'    => "sometimes|email|unique:users,email,{$id}",
            'password' => 'nullable|string|min:8',
            'role'     => 'sometimes|in:officer',
            'is_active'=> 'sometimes|boolean',
            'ds_id'    => 'required|integer|exists:divisional_secretariat,id',
        ]);

        $data = $request->only(['name', 'email', 'is_active']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }
        $user->update($data);

        if ($request->filled('ds_id')) {
            OfficerDsAssignment::where('user_id', $user->id)->update(['is_active' => false]);
            OfficerDsAssignment::create([
                'user_id'                   => $user->id,
                'divisional_secretariat_id' => $request->ds_id,
                'is_active'                 => true,
            ]);
        }

        return response()->json(['message' => 'User updated.', 'user' => $user->fresh()->load('activeDsAssignment')]);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);

        if (!$user->isOfficer()) {
            return response()->json(['message' => 'Only Divisional Secretary accounts can be deleted here.'], 403);
        }

        $user->tokens()->delete();
        $user->delete();
        return response()->json(['message' => 'User deleted.']);
    }
}
