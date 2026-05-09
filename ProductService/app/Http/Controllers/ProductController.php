<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
            'name' => 'required|string',
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

    // PUT /api/products/{id}/reduce-stock — dipanggil oleh OrderService
    public function reduceStock(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $quantity = $request->quantity;

        // Cek stok cukup atau tidak
        if ($product->stock < $quantity) {
            return response()->json([
                'message' => 'Stok tidak mencukupi',
                'stok_tersedia' => $product->stock,
                'diminta' => $quantity
            ], 400);
        }

        // Kurangi stok
        $product->stock = $product->stock - $quantity;
        $product->save();

        return response()->json([
            'message' => 'Stok berhasil dikurangi',
            'product_id' => $product->id,
            'stok_sebelum' => $product->stock + $quantity,
            'stok_sesudah' => $product->stock
        ], 200);
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

        $keyword = $request->query('name');

        $products = DB::table('products')
            ->where('name', 'LIKE', '%' . $keyword . '%')
            ->get();

        if ($products->count() > 0) {
            return response()->json([
                'status' => 'Success',
                'data' => $products
            ], 200);
        }

        return response()->json([
            'status' => 'Failed',
            'message' => 'Produk tidak ditemukan di database.',
            'keyword_yang_dicari' => $keyword
        ], 404);
    }
}
