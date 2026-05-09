const express = require("express");
const cors = require("cors");
require("dotenv").config();

// ✅ Import RabbitMQ
const { connectRabbitMQ } = require("./config/rabbitmq");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/orders", require("./routes/orders"));

app.get("/", (req, res) => {
  res.json({
    service: "OrderService",
    status: "running",
    port: process.env.PORT,
  });
});

const PORT = process.env.PORT || 8003;

// ✅ Koneksi ke RabbitMQ saat server start
connectRabbitMQ().then(() => {
  app.listen(PORT, () => {
    console.log(`OrderService berjalan di http://localhost:${PORT}`);
  });
});
