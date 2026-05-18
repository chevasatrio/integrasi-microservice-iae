<?php

namespace App\Jobs;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class UpdateProductStock implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    // Constructor tetap ada untuk jaga-jaga jika dipanggil dari Laravel internal
    public function __construct(
        public $productId = null,
        public $quantity = null,
        public $orderId = null,
    ) {
    }

    /**
     * ✅ FIX UTAMA:
     * handle() TIDAK menerima parameter $data dari Laravel.
     * Data dari RabbitMQ harus dibaca via $this->job->getRawBody()
     *
     * Alur:
     * Node.js (publisher) → RabbitMQ queue → Laravel worker → handle() ini
     */
    public function handle(): void
    {
        try {
            // ✅ FIX BUG 1: Baca raw payload dari RabbitMQ
            $rawBody = $this->job->getRawBody();
            $payload = json_decode($rawBody, true);

            Log::info('[ProductService Consumer] Raw payload diterima dari RabbitMQ', [
                'payload' => $payload
            ]);

            // ✅ FIX BUG 2: Data ada di dalam key 'data' sesuai format rabbitmq.js
            $data = $payload['data'] ?? [];

            // Ambil productId dan quantity dari payload Node.js
            $productId = $data['productId'] ?? $this->productId ?? null;
            $quantity = (int) ($data['quantity'] ?? $this->quantity ?? 0);
            $orderId = $data['orderId'] ?? $this->orderId ?? null;

            Log::info('[ProductService Consumer] Data yang akan diproses', [
                'product_id' => $productId,
                'quantity' => $quantity,
                'order_id' => $orderId,
            ]);

            // Validasi: productId dan quantity harus ada
            if (!$productId || $quantity <= 0) {
                Log::error('[ProductService Consumer] ❌ Data tidak valid', [
                    'productId' => $productId,
                    'quantity' => $quantity,
                    'raw_data' => $data,
                ]);
                return;
            }

            // Cari produk di database
            $product = Product::find($productId);

            if (!$product) {
                Log::error("[ProductService Consumer] ❌ Produk ID {$productId} tidak ditemukan");
                return;
            }

            // Validasi stok cukup
            if ($product->stock < $quantity) {
                Log::warning('[ProductService Consumer] ⚠️ Stok tidak mencukupi', [
                    'produk' => $product->name,
                    'stok_ada' => $product->stock,
                    'diminta' => $quantity,
                ]);
                return;
            }

            // Kurangi stok
            $stokSebelum = $product->stock;
            $product->decrement('stock', $quantity);

            Log::info('[ProductService Consumer] ✅ Stok berhasil dikurangi', [
                'produk' => $product->name,
                'stok_sebelum' => $stokSebelum,
                'stok_sesudah' => $product->fresh()->stock,
                'order_id' => $orderId,
            ]);

        } catch (Throwable $e) {
            Log::error('[ProductService Consumer] ❌ CRASH saat eksekusi Job', [
                'pesan' => $e->getMessage(),
                'file' => $e->getFile(),
                'baris' => $e->getLine(),
            ]);
            throw $e; // Lempar kembali agar Laravel retry
        }
    }

    /**
     * Dipanggil setelah semua percobaan gagal
     */
    public function failed(Throwable $exception): void
    {
        Log::error('[ProductService Consumer] ❌ Job menyerah setelah 3x percobaan', [
            'error' => $exception->getMessage(),
        ]);
    }
}