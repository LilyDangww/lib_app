const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authToken");
const permission = require("../helpers/permission");

const {
  createReservation,
  getReservations, // User: danh sách phiếu giữ (lọc)
  getReservationWithDetails, // User: chi tiết phiếu giữ (gồm sách)
  getReservationsForLibrarian, // Librarian: danh sách phiếu giữ
  confirmReservation, // Librarian: xác nhận phiếu giữ
  updateReservationDetail, // Librarian: cập nhật chi tiết giữ theo barcode
  cancelReservation, // User & Librarian: hủy phiếu giữ
} = require("../controllers/reservationController");

// ================== USER ================== //

// User tạo phiếu giữ
router.post("/", authToken, createReservation);

// User xem danh sách phiếu giữ (lọc theo trạng thái + ngày)
router.get("/", authToken, getReservations);

// User xem chi tiết phiếu giữ (kèm thông tin sách)
router.get("/:id/details", authToken, getReservationWithDetails);

// User hủy phiếu giữ của mình
router.delete("/:id", authToken, cancelReservation);

// ================== LIBRARIAN ================== //

// Thủ thư xem danh sách phiếu giữ (lọc theo trạng thái, ngày, user)
router.get(
  "/librarian/list",
  authToken,
  permission.isLibrarian,
  getReservationsForLibrarian
);

// Thủ thư xác nhận phiếu giữ (chuyển sang active + chi tiết on_hold)
router.patch(
  "/:id/confirm",
  authToken,
  permission.isLibrarian,
  confirmReservation
);

// Thủ thư cập nhật chi tiết giữ theo barcode (picked_up, cancel, expired)
router.patch(
  "/librarian/detail/:barcode",
  authToken,
  permission.isLibrarian,
  updateReservationDetail
);

module.exports = router;
