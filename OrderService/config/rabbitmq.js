// OrderService/config/rabbitmq.js

const amqp = require("amqplib");
const crypto = require("crypto");

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";
const QUEUE_NAME = "product-stock-update";

let channel = null;
let connection = null;

/**
 * Koneksi ke RabbitMQ dengan retry otomatis
 */
async function connectRabbitMQ() {
  let retries = 15;
  while (retries > 0) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

      // durable: true → queue tidak hilang saat RabbitMQ restart
      await channel.assertQueue(QUEUE_NAME, { durable: true });

      console.log("[RabbitMQ] ✅ Terkoneksi ke:", RABBITMQ_URL);
      console.log("[RabbitMQ] ✅ Queue ready:", QUEUE_NAME);

      // Auto-reconnect jika koneksi putus
      connection.on("error", async (err) => {
        console.error("[RabbitMQ] ❌ Koneksi error:", err.message);
        channel = null;
        connection = null;
        // Coba reconnect setelah 5 detik
        setTimeout(() => connectRabbitMQ(), 5000);
      });

      connection.on("close", () => {
        console.warn("[RabbitMQ] ⚠️ Koneksi ditutup, reconnecting...");
        channel = null;
        connection = null;
        setTimeout(() => connectRabbitMQ(), 5000);
      });

      return;
    } catch (err) {
      retries--;
      console.log(
        `[RabbitMQ] ⏳ Menunggu RabbitMQ... (${retries} sisa). Error: ${err.message}`,
      );
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
  console.error(
    "[RabbitMQ] ❌ Gagal konek setelah semua percobaan. Order tetap berjalan.",
  );
}

/**
 * ✅ FIX: PUBLISHER — Format payload yang benar untuk Laravel Queue Worker
 *
 * Alur: OrderService (Node.js) → publish → RabbitMQ queue
 *       → product-worker (Laravel php artisan queue:work)
 *       → UpdateProductStock::handle() membaca $this->job->getRawBody()
 *
 * Format payload harus konsisten dengan yang dibaca di UpdateProductStock.php
 */
async function publishStockUpdate(productId, quantity, orderId) {
  // Jika channel null, coba reconnect
  if (!channel) {
    console.warn("[RabbitMQ] ⚠️ Channel null, mencoba reconnect...");
    await connectRabbitMQ();
    if (!channel) {
      console.error(
        "[RabbitMQ] ❌ Tidak bisa publish — channel tidak tersedia",
      );
      return false;
    }
  }

  try {
    /**
     * ✅ FIX: Struktur payload yang benar
     *
     * - uuid: ID unik untuk tracking job
     * - displayName: nama class Laravel untuk logging
     * - job: class yang akan di-instantiate oleh Laravel worker
     * - data: isi pesan yang dibaca via $this->job->getRawBody() di PHP
     *         → key harus SAMA PERSIS dengan yang dibaca di UpdateProductStock.php
     */
    const payload = {
      uuid: crypto.randomUUID(),
      displayName: "App\\Jobs\\UpdateProductStock",
      job: "App\\Jobs\\UpdateProductStock",
      maxTries: 3,
      delay: null,
      timeout: 90,
      // ✅ data ini yang akan dibaca di PHP via:
      //    $payload['data']['productId'], $payload['data']['quantity'], dst.
      data: {
        productId: String(productId), // String agar aman di PHP
        quantity: parseInt(quantity), // Integer
        orderId: String(orderId), // String
      },
    };

    const buffer = Buffer.from(JSON.stringify(payload));

    const sent = channel.sendToQueue(QUEUE_NAME, buffer, {
      persistent: true, // Pesan tidak hilang saat restart
      contentType: "application/json", // Beri tahu tipe konten
      deliveryMode: 2, // Persistent delivery
    });

    if (sent) {
      console.log("[RabbitMQ] ✅ Pesan stok dikirim:", {
        productId,
        quantity,
        orderId,
        queue: QUEUE_NAME,
      });
    } else {
      console.warn("[RabbitMQ] ⚠️ Buffer channel penuh, pesan tidak terkirim");
    }

    return sent;
  } catch (error) {
    console.error("[RabbitMQ] ❌ Gagal publish:", error.message);
    channel = null; // Reset channel agar reconnect di publish berikutnya
    return false;
  }
}

module.exports = { connectRabbitMQ, publishStockUpdate };
