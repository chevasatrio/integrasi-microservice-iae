const express = require("express");
const router = express.Router();
const orderCtrl = require("../controllers/orderController");

router.get("/", orderCtrl.getAllOrders); // Provider
router.get("/:id", orderCtrl.getOrderById); // Provider
router.post("/", orderCtrl.createOrder); // Consumer
router.put("/:id/status", orderCtrl.updateOrderStatus);
router.delete("/:id", orderCtrl.deleteOrder);

module.exports = router;
