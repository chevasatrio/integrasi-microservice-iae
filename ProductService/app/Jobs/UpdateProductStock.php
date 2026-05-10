<?php

namespace App\Jobs;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UpdateProductStock implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly string $productId,
        public readonly int $quantity,
        public readonly string $orderId,
    ) {
    }

    /**
     * CONSUMER — dieksekusi oleh queue worker saat menerima pesan dari RabbitMQ
     * Pesan dikirim oleh OrderService saat order berhasil dibuat
     */
    public function handle(): void
    {
        Log::info("[ProductService Consumer] Menerima pesan dari RabbitMQ", [
            'product_id' => $this->productId,
            'quantity' => $this->quantity,
            'order_id' => $this->orderId,
        ]);

        $product = Product::find($this->productId);

        if (!$product) {
            Log::error("[ProductService Consumer] Produk tidak ditemukan: {$this->productId}");
            return;
        }

        if ($product->stock < $this->quantity) {
            Log::warning("[ProductService Consumer] Stok tidak mencukupi", [
                'stok_ada' => $product->stock,
                'diminta' => $this->quantity,
            ]);
            return;
        }

        // Kurangi stok (proses async — dikerjakan di background)
        $stokSebelum = $product->stock;
        $product->stock -= $this->quantity;
        $product->save();

        Log::info("[ProductService Consumer] Stok berhasil dikurangi", [
            'product_id' => $this->productId,
            'stok_sebelum' => $stokSebelum,
            'stok_sesudah' => $product->stock,
            'order_id' => $this->orderId,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("[ProductService Consumer] Job gagal: " . $exception->getMessage());
    }
}