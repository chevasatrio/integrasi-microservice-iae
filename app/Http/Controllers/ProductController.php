<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // GET /api/products — Provider: ambil semua produk
    public function index()
    {
        $products = Product::all();
        return response()->json($products, 200);
    }

    // GET /api/products/{id} — Provider: ambil produk by ID
    public function show($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }
        return response()->json($product, 200);
    }

    // POST /api/products — Tambah produk baru
    public function store(Request $request)
    {
        $request->validate([
            'name'  => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
        ]);

        $product = Product::create($request->all());
        return response()->json($product, 201);
    }

    // PUT /api/products/{id} — Update produk
    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }
        $product->update($request->all());
        return response()->json($product, 200);
    }

    // DELETE /api/products/{id} — Hapus produk
    public function destroy($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }
        $product->delete();
        return response()->json(['message' => 'Product deleted'], 200);
    }

    // GET /api/products/search?name=xxx — Fitur pencarian
    public function search(Request $request)
    {
        $query = $request->get('name');
        $products = Product::where('name', 'like', "%$query%")->get();
        return response()->json($products, 200);
    }
}
