const amqp = require('amqplib');
const crypto = require('crypto'); // Built-in Node.js untuk buat ID unik

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const QUEUE_NAME = 'product-stock-update';

let channel = null;

async function connectRabbitMQ() {
    let retries = 10;
    while (retries > 0) {
        try {
            const connection = await amqp.connect(RABBITMQ_URL);
            channel = await connection.createChannel();
            
            // Durable true agar queue tidak hilang saat RabbitMQ restart
            await channel.assertQueue(QUEUE_NAME, { durable: true });
            
            console.log('[RabbitMQ] Berhasil konek ke:', RABBITMQ_URL);
            console.log('[RabbitMQ] Antrean siap:', QUEUE_NAME);

            connection.on('error', (err) => {
                console.error('[RabbitMQ] Koneksi error:', err.message);
                channel = null;
            });
            
            return;
        } catch (err) {
            retries--;
            console.log(`[RabbitMQ] Menunggu RabbitMQ... (${retries} sisa). Error: ${err.message}`);
            await new Promise(res => setTimeout(res, 3000));
        }
    }
}

/**
 * PUBLISHER — Versi yang sudah dioptimalkan untuk Laravel 10/11
 */
async function publishStockUpdate(productId, quantity, orderId) {
    if (!channel) {
        console.warn('[RabbitMQ] Channel null, mencoba konek ulang...');
        await connectRabbitMQ();
        if (!channel) return false;
    }

    try {
        // ⚠️ STRUKTUR KRUSIAL: Laravel butuh ini agar tidak error "Undefined job"
        const payload = {
            uuid: crypto.randomUUID(), // Laravel modern butuh UUID untuk setiap job
            displayName: 'App\\Jobs\\UpdateProductStock',
            job: 'App\\Jobs\\UpdateProductStock', // Namespace lengkap class Job kamu
            maxTries: 3,
            delay: null,
            timeout: null,
            data: {
                // Data ini akan masuk ke fire() atau handle() di Laravel
                productId: productId.toString(), // Kirim sebagai string agar aman di DB
                quantity: parseInt(quantity),    // Pastikan angka
                orderId: orderId.toString()
            }
        };

        const messageBuffer = Buffer.from(JSON.stringify(payload));

        const result = channel.sendToQueue(
            QUEUE_NAME,
            messageBuffer,
            { 
                persistent: true,
                contentType: 'application/json' // Beri tahu RabbitMQ ini adalah JSON
            }
        );

        console.log('[RabbitMQ] Pesan terkirim ke Laravel:', payload.data);
        return result;
    } catch (error) {
        console.error('[RabbitMQ] Gagal publish pesan:', error.message);
        return false;
    }
}

module.exports = { connectRabbitMQ, publishStockUpdate };