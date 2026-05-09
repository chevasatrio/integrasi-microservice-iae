const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const QUEUE_NAME   = 'product-stock-update';

let channel = null;

/**
 * Membuat koneksi ke RabbitMQ dengan retry otomatis
 */
async function connectRabbitMQ() {
    let retries = 10;
    while (retries > 0) {
        try {
            const connection = await amqp.connect(RABBITMQ_URL);
            channel = await connection.createChannel();
            await channel.assertQueue(QUEUE_NAME, { durable: true });
            console.log('[RabbitMQ] Terkoneksi ke:', RABBITMQ_URL);
            console.log('[RabbitMQ] Queue ready:', QUEUE_NAME);

            connection.on('error', (err) => {
                console.error('[RabbitMQ] Connection error:', err.message);
                channel = null;
            });
            return;
        } catch (err) {
            retries--;
            console.log(`[RabbitMQ] Koneksi gagal, mencoba lagi... (${retries} sisa). Error: ${err.message}`);
            await new Promise(res => setTimeout(res, 3000));
        }
    }
    console.error('[RabbitMQ] Gagal terkoneksi setelah banyak percobaan. Order tetap berjalan tanpa async stock update.');
}

/**
 * PUBLISHER — Kirim pesan ke RabbitMQ
 * Dipanggil oleh OrderController setelah order berhasil disimpan
 */
async function publishStockUpdate(productId, quantity, orderId) {
    if (!channel) {
        console.warn('[RabbitMQ] Channel tidak tersedia, skip publish');
        return false;
    }

    const message = JSON.stringify({
        productId,
        quantity: parseInt(quantity),
        orderId,
        timestamp: new Date().toISOString(),
    });

    channel.sendToQueue(
        QUEUE_NAME,
        Buffer.from(message),
        { persistent: true }  // pesan bertahan meski RabbitMQ restart
    );

    console.log('[RabbitMQ] Pesan dikirim ke queue:', { productId, quantity, orderId });
    return true;
}

module.exports = { connectRabbitMQ, publishStockUpdate };