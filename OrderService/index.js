const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/orders", require("./routes/orders"));

// Health check
app.get("/", (req, res) => {
  res.json({
    service: "OrderService",
    status: "running",
    port: process.env.PORT,
  });
});

const PORT = process.env.PORT || 8003;
app.listen(PORT, () => {
  console.log(`OrderService berjalan di http://localhost:${PORT}`);
});
