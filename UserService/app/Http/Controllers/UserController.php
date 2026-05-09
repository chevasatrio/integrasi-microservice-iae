<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class UserController extends Controller
{
    // GET /api/users — Provider: ambil semua user
    public function index()
    {
        $users = User::all();
        return response()->json($users, 200);
    }

    // GET /api/users/{id} — Provider: ambil user by ID
    public function show($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        return response()->json($user, 200);
    }

    // POST /api/users — Tambah user baru
    public function store(Request $request)
    {
        $request->validate([
            'name'  => 'required|string',
            'email' => 'required|email|unique:users',
        ]);

        $user = User::create($request->all());
        return response()->json($user, 201);
    }

    // PUT /api/users/{id} — Update user
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        $user->update($request->all());
        return response()->json($user, 200);
    }

    // DELETE /api/users/{id} — Hapus user
    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        $user->delete();
        return response()->json(['message' => 'User deleted'], 200);
    }

    // GET /api/users/{id}/orders — Consumer: ambil histori order dari OrderService
    public function orderHistory($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        try {
            // Memanggil OrderService sebagai Consumer
            $response = Http::get('http://localhost:8003/api/orders', [
                'user_id' => $id
            ]);
            return response()->json([
                'user'   => $user,
                'orders' => $response->json()
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'user'   => $user,
                'orders' => [],
                'error'  => 'OrderService tidak dapat dihubungi'
            ], 200);
        }
    }
}
