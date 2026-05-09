const db = require("../config/db");
const axios = require("axios");
const { publishStockUpdate } = require("../config/rabbitmq"); // ✅ Import publisher
require("dotenv").config();

const USER_SERVICE = process.env.USER_SERVICE_URL;
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL;

exports.createOrder = async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id || !quantity)
    return res
      .status(400)
      .json({ message: "user_id, product_id, dan quantity wajib diisi" });

  try {
    // STEP 1: Consumer sinkron — Ambil data user dari UserService
    let user;
    try {
      const userRes = await axios.get(`${USER_SERVICE}/api/users/${user_id}`);
      user = userRes.data;
    } catch {
      return res
        .status(404)
        .json({ message: `User ID ${user_id} tidak ditemukan di UserService` });
    }

    // STEP 2: Consumer sinkron — Ambil data produk dari ProductService
    let product;
    try {
      const productRes = await axios.get(
        `${PRODUCT_SERVICE}/api/products/${product_id}`,
      );
      product = productRes.data;
    } catch {
      return res
        .status(404)
        .json({
          message: `Product ID ${product_id} tidak ditemukan di ProductService`,
        });
    }

    // STEP 3: Validasi stok (sinkron)
    if (product.stock < quantity)
      return res
        .status(400)
        .json({ message: `Stok tidak cukup. Tersedia: ${product.stock}` });

    // STEP 4: Simpan order ke DB
    const total_price = parseFloat(product.price) * quantity;
    const [result] = await db.execute(
      "INSERT INTO orders (user_id, product_id, quantity, total_price, status) VALUES (?, ?, ?, ?, ?)",
      [user_id, product_id, quantity, total_price, "pending"],
    );

    // ✅ STEP 5: PUBLISH ke RabbitMQ — ASYNC, tidak blocking!
    // OrderService langsung response ke client,
    // ProductService worker yang akan kurangi stok di background
    await publishStockUpdate(product_id, quantity, result.insertId);

    console.log(
      `[OrderService Publisher] Order #${result.insertId} dibuat, pesan stok dikirim ke RabbitMQ`,
    );

    // STEP 6: Response langsung tanpa menunggu stok terkurangi
    res.status(201).json({
      message: "Order berhasil dibuat (stok sedang diperbarui secara asinkron)",
      order_id: result.insertId,
      user_name: user.name,
      product_name: product.name,
      quantity,
      total_price,
      status: "pending",
      async_note: "Pengurangan stok diproses di background via RabbitMQ",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Endpoint lain tetap sama seperti sebelumnya ...
exports.getAllOrders = async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = "SELECT * FROM orders";
    const params = [];
    if (user_id) {
      query += " WHERE user_id = ?";
      params.push(user_id);
    }
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM orders WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Order not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const [result] = await db.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, req.params.id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Status diperbarui", status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM orders WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
