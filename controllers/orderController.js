const db = require("../config/db");
const axios = require("axios");
require("dotenv").config();

const USER_SERVICE = process.env.USER_SERVICE_URL;
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL;

// ─── GET ALL ORDERS (Provider) ───────────────────────────────────────────────
// Digunakan oleh UI dan UserService (histori order)
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

// ─── GET ORDER BY ID (Provider) ──────────────────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM orders WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── CREATE ORDER (Consumer ke UserService & ProductService) ─────────────────
exports.createOrder = async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id || !quantity) {
    return res
      .status(400)
      .json({ message: "user_id, product_id, dan quantity wajib diisi" });
  }

  try {
    // STEP 1: Ambil data user dari UserService
    let user;
    try {
      const userRes = await axios.get(`${USER_SERVICE}/api/users/${user_id}`);
      user = userRes.data;
    } catch {
      return res
        .status(404)
        .json({ message: `User ID ${user_id} tidak ditemukan` });
    }

    // STEP 2: Ambil data produk dari ProductService
    let product;
    try {
      const productRes = await axios.get(
        `${PRODUCT_SERVICE}/api/products/${product_id}`,
      );
      product = productRes.data;
    } catch {
      return res
        .status(404)
        .json({ message: `Product ID ${product_id} tidak ditemukan` });
    }

    //  STEP 3: Cek stok cukup atau tidak 
    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Stok tidak mencukupi. Stok tersedia: ${product.stock}, diminta: ${quantity}`,
      });
    }

    // STEP 4: Hitung total harga
    const total_price = parseFloat(product.price) * quantity;

    // STEP 5: Simpan order ke database
    const [result] = await db.execute(
      "INSERT INTO orders (user_id, product_id, quantity, total_price, status) VALUES (?, ?, ?, ?, ?)",
      [user_id, product_id, quantity, total_price, "pending"],
    );

    //STEP 6: Kurangi stok di ProductService
    try {
      await axios.put(
        `${PRODUCT_SERVICE}/api/products/${product_id}/reduce-stock`,
        {
          quantity: parseInt(quantity),
        },
      );
    } catch (stockErr) {
      // Order sudah tersimpan, tapi stok gagal dikurangi
      // Log error tapi jangan batalkan order
      console.error("[OrderService] Gagal mengurangi stok:", stockErr.message);
    }

    // STEP 7: Response sukses
    res.status(201).json({
      message: "Order berhasil dibuat",
      order_id: result.insertId,
      user_name: user.name,
      product_name: product.name,
      quantity,
      total_price,
      stok_tersisa: product.stock - quantity, // ← info sisa stok
      status: "pending",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── UPDATE STATUS ORDER ──────────────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const [result] = await db.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, req.params.id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json({ message: "Status order diperbarui", status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE ORDER ─────────────────────────────────────────────────────────────
exports.deleteOrder = async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM orders WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
