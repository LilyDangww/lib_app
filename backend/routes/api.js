const express = require("express");
const router = express.Router();

// ========== Import các sub-routes ==========
const documentRoutes = require("./documentRoutes");
const recordRoutes = require("./recordRoutes");
const borrowRoutes = require("./borrowRoutes");
const userRoutes = require("./userRoutes");
const borrowDetailRoutes = require("./borrowDetailRoutes");
const authRoutes = require("./authRoutes");
const reservationRoutes = require("./reservationRoutes");

// ========== Test route gốc ==========
router.get("/", (req, res) => {
  return res.status(200).json("Welcome to Library API 🚀");
});

// ========== Mount sub-routes ==========
router.use("/documents", documentRoutes);
router.use("/records", recordRoutes);
router.use("/borrows", borrowRoutes);
router.use("/users", userRoutes);
router.use("/borrow-details", borrowDetailRoutes);
router.use("/auth", authRoutes);
router.use("/reservations", reservationRoutes);

// router.use("/inventory", require("./inventoryRoutes"));

// Sau này có thêm:
// const userRoutes = require("./userRoutes");
// router.use("/users", userRoutes);

module.exports = router;
