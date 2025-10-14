const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authToken");
const permission = require("../helpers/permission");

const {
  createReservation,
  getReservations,
  getReservationById,
  confirmReservation,
  cancelReservation,
  getReservationDetails,
} = require("../controllers/reservationController");

// User tạo phiếu giữ
router.post("/", authToken, createReservation);

// Xem danh sách phiếu giữ
router.get("/", authToken, getReservations);

// Xem chi tiết phiếu giữ
router.get("/:id", authToken, getReservationById);
router.get("/:id/details", authToken, getReservationDetails);

// Thủ thư xác nhận
router.patch(
  "/:id/confirm",
  authToken,
  permission.isLibrarian,
  confirmReservation
);

// Hủy phiếu giữ
router.delete("/:id", authToken, cancelReservation);

module.exports = router;
