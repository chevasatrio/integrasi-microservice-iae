const db = require("../config/db");
const axios = require("axios");
const { publishStockUpdate } = require("../config/rabbitmq");
require("dotenv").config();

const USER_SERVICE = process.env.USER_SERVICE_URL;
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL;

exports.createOrder = async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  // 1. Validasi Input Dasar
  if (!user_id || !product_id || !quantity) {
    return res.status(400).json({ 
      message: "user_id, product_id, dan quantity wajib diisi" 
    });
  }

  try {
    // STEP 1: Cek User ke UserService (Sinkron)
    let user;
    try {
      const userRes = await axios.get(`${USER_SERVICE}/api/users/${user_id}`);
      user = userRes.data;
    } catch (err) {
      return res.status(404).json({ 
        message: `User ID ${user_id} tidak ditemukan. Error: ${err.message}` 
      });
    }

    // STEP 2: Cek Produk ke ProductService (Sinkron)
    let product;
    try {
      const productRes = await axios.get(`${PRODUCT_SERVICE}/api/products/${product_id}`);
      product = productRes.data;
    } catch (err) {
      return res.status(404).json({ 
        message: `Product ID ${product_id} tidak ditemukan. Error: ${err.message}` 
      });
    }

    // STEP 3: Validasi Stok (Sinkron)
    const qtyOrdered = parseInt(quantity);
    if (product.stock < qtyOrdered) {
      return res.status(400).json({ 
        message: `Stok tidak cukup. Tersedia: ${product.stock}, Diminta: ${qtyOrdered}` 
      });
    }

    // STEP 4: Hitung Total Harga & Simpan ke MySQL (OrderService DB)
    const total_price = parseFloat(product.price) * qtyOrdered;
    
    const [result] = await db.execute(
      "INSERT INTO orders (user_id, product_id, quantity, total_price, status) VALUES (?, ?, ?, ?, ?)",
      [user_id, product_id, qtyOrdered, total_price, "pending"]
    );

    const orderId = result.insertId;

    // ✅ STEP 5: PUBLISH ke RabbitMQ (Asinkron) - Format baru sudah ditangani di rabbitmq.js
    const isPublished = await publishStockUpdate(product_id, qtyOrdered, orderId);

    if (!isPublished) {
      console.error(`[RabbitMQ] Gagal mengirim pesan stok untuk Order #${orderId}`);
    } else {
      console.log(`[OrderService] Order #${orderId} sukses disimpan. Pesan stok dipublish.`);
    }

    // STEP 6: Response ke Client
    return res.status(201).json({
      message: "Order berhasil dibuat",
      data: {
        order_id: orderId,
        user_name: user.name,
        product_name: product.name,
        quantity: qtyOrdered,
        total_price: total_price,
        status: "pending"
      },
      async_note: isPublished ? "Stok akan diperbarui secara otomatis" : "⚠️ Perhatian: Pembaruan stok tertunda"
    });

  } catch (err) {
    console.error("[OrderController Error]:", err.message);
    return res.status(500).json({ 
      error: "Gagal memproses order", 
      details: err.message 
    });
  }
};

// ... (Biarkan fungsi getAllOrders, getOrderById, updateOrderStatus, deleteOrder seperti sebelumnya) ...