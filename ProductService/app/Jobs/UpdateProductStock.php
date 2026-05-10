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

    /**
     * Constructor
     * Saat dikirim dari Node.js, properti ini mungkin kosong, 
     * jadi kita buat opsional (null).
     */
    public function __construct(
        public $productId = null,
        public $quantity = null,
        public $orderId = null,
    ) {}
    /**
     * Handle Job
     * Parameter $data akan berisi isi dari key 'data' yang dikirim Node.js
     */
    public function handle($data = null): void
    {
        try {
            // 1. Pemetaan Data (Mapping)
            // Kita ambil dari $data (jika dari Node.js) atau dari $this (jika dari Laravel sendiri)
            $id = $data['productId'] ?? $this->productId;
            $qty = (int) ($data['quantity'] ?? $this->quantity ?? 0);

            Log::info("[ProductService Consumer] Memulai proses Job", [
                'target_id' => $id,
                'qty' => $qty,
                'source' => $data ? 'RabbitMQ (Node.js)' : 'Internal Laravel'
            ]);

            // 2. Validasi ID
            if (!$id) {
                Log::error("[ProductService Consumer] Gagal: Product ID kosong.");
                return;
            }

            // 3. Eksekusi ke Database
            $product = Product::find($id);

            if (!$product) {
                Log::error("[ProductService Consumer] Gagal: Produk ID {$id} tidak ditemukan di database.");
                // Jika pakai MySQL, pastikan ID-nya benar.
                return;
            }

            // 4. Validasi Stok
            if ($product->stock < $qty) {
                Log::warning("[ProductService Consumer] Gagal: Stok tidak mencukupi.", [
                    'produk' => $product->name,
                    'sisa' => $product->stock,
                    'diminta' => $qty
                ]);
                return;
            }

            // 5. Potong Stok
            $stokLama = $product->stock;
            $product->decrement('stock', $qty);

            Log::info("[ProductService Consumer] ✅ SUKSES!", [
                'produk' => $product->name,
                'sebelum' => $stokLama,
                'sesudah' => $product->stock
            ]);
        } catch (Throwable $e) {
            // Tangkap error apapun dan catat di log agar tidak misterius
            Log::error("[ProductService Consumer] CRASH saat eksekusi Job!", [
                'pesan' => $e->getMessage(),
                'file' => $e->getFile(),
                'baris' => $e->getLine()
            ]);

            // Lempar kembali error-nya agar Laravel tahu Job ini FAIL
            throw $e;
        }
    }

    /**
     * Jika Job gagal setelah semua percobaan
     */
    public function failed(Throwable $exception): void
    {
        Log::error("[ProductService Consumer] Job menyerah setelah 3x coba.", [
            'error' => $exception->getMessage()
        ]);
    }
}