require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/api");
require("./config/db"); // kết nối database
const { swaggerUi, specs } = require("./config/swagger"); // ✅ import Swagger
const cron = require("node-cron");
const Reservation = require("./models/reservationModel");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", apiRoutes);

// ✅ Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Test route
app.get("/", (req, res) => {
  res.send("📚 Welcome to Library API!");
});

cron.schedule("0 0 * * *", async () => {
  try {
    const result = await Reservation.expireOverdueReservations();
    console.log("🕛 Auto Expire:", result.message);
  } catch (err) {
    console.error("❌ Auto Expire failed:", err.message);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📘 Swagger Docs: http://localhost:${PORT}/api-docs`);
});
