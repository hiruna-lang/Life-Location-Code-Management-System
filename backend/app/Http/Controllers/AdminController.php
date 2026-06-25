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
            'ds_id'    => 'nullable|integer',
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

        $request->validate([
            'name'     => 'sometimes|string|max:255',
            'email'    => "sometimes|email|unique:users,email,{$id}",
            'password' => 'nullable|string|min:8',
            'role'     => 'sometimes|in:admin,officer',
            'is_active'=> 'sometimes|boolean',
            'ds_id'    => 'nullable|integer',
        ]);

        $data = $request->only(['name', 'email', 'role', 'is_active']);
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
        $user->tokens()->delete();
        $user->delete();
        return response()->json(['message' => 'User deleted.']);
    }
}
