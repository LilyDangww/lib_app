const express = require("express");
const router = express.Router();

// ========== Import các sub-routes ==========
const documentRoutes = require("./documentRoutes");
const recordRoutes = require("./recordRoutes");
const borrowRoutes = require("./borrowRoutes");
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const reservationRoutes = require("./reservationRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const categoryRoutes = require("./categoryRoutes");

// ========== Test route gốc ==========
router.get("/", (req, res) => {
  return res.status(200).json("Welcome to Library API 🚀");
});

// ========== Mount sub-routes ==========
router.use("/documents", documentRoutes);
router.use("/records", recordRoutes);
router.use("/borrows", borrowRoutes);
router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/reservations", reservationRoutes);
router.use("/fines", require("./finesRoutes"));
router.use("/dashboard", require("./dashboardRoutes"));
router.use("/categories", require("./categoryRoutes"));

// router.use("/inventory", require("./inventoryRoutes"));

// Sau này có thêm:
// const userRoutes = require("./userRoutes");
// router.use("/users", userRoutes);

module.exports = router;
