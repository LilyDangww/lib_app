/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: API endpoints for managing book reservations (Quản lý phiếu giữ sách)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       properties:
 *         reservation_id:
 *           type: integer
 *           description: ID của phiếu giữ
 *           example: 1
 *         user_id:
 *           type: integer
 *           description: ID của người dùng tạo phiếu giữ
 *           example: 5
 *         hold_type:
 *           type: string
 *           description: Loại giữ (hard hoặc soft)
 *           example: hard
 *         status:
 *           type: string
 *           description: Trạng thái phiếu giữ (processing, active, closed, cancelled)
 *           example: processing
 *         request_date:
 *           type: string
 *           format: date-time
 *           description: Ngày tạo phiếu giữ
 *           example: 2025-10-23T09:00:00Z
 *         note:
 *           type: string
 *           description: Ghi chú khi tạo phiếu giữ
 *           example: "Giữ sách để đọc vào cuối tuần"
 *
 *     ReservationDetail:
 *       type: object
 *       properties:
 *         detail_id:
 *           type: integer
 *           description: ID của chi tiết giữ
 *           example: 101
 *         record_id:
 *           type: integer
 *           description: ID bản ghi sách
 *           example: 22
 *         barcode:
 *           type: string
 *           description: Mã barcode của bản ghi
 *           example: "LIB002003"
 *         book_title:
 *           type: string
 *           description: Tên sách được giữ
 *           example: "Lập trình JavaScript nâng cao"
 *         detail_status:
 *           type: string
 *           description: Trạng thái của chi tiết giữ (pending, on_hold, picked_up, cancelled, expired)
 *           example: pending
 *         hold_start_at:
 *           type: string
 *           format: date-time
 *           example: 2025-10-23T08:00:00Z
 *         default_expire_at:
 *           type: string
 *           format: date-time
 *           example: 2025-10-25T08:00:00Z
 */

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Người đọc tạo phiếu giữ mới
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hold_type:
 *                 type: string
 *                 description: Loại giữ (hard hoặc soft)
 *               record_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Danh sách ID bản ghi cần giữ (tối đa 2)
 *               note:
 *                 type: string
 *                 description: Ghi chú cho phiếu giữ
 *     responses:
 *       201:
 *         description: Tạo phiếu giữ thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc vượt quá số lượng giữ cho phép
 */

/**
 * @swagger
 * /reservations/my/holds:
 *   get:
 *     summary: Người đọc xem danh sách các sách đang giữ của mình
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Trạng thái chi tiết giữ cần lọc (pending, on_hold, cancelled, ...)
 *     responses:
 *       200:
 *         description: Danh sách chi tiết giữ của người đọc
 */

/**
 * @swagger
 * /reservations/detail/{detail_id}/cancel:
 *   patch:
 *     summary: Người đọc hủy một chi tiết giữ
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: detail_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID chi tiết giữ cần hủy
 *     responses:
 *       200:
 *         description: Hủy chi tiết giữ thành công
 *       400:
 *         description: Không thể hủy ở trạng thái hiện tại
 *       403:
 *         description: Không có quyền hủy chi tiết giữ này
 *       404:
 *         description: Không tìm thấy chi tiết giữ
 */

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Người đọc hoặc thủ thư hủy toàn bộ phiếu giữ
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID phiếu giữ cần hủy
 *     responses:
 *       200:
 *         description: Hủy phiếu giữ thành công
 *       404:
 *         description: Không tìm thấy phiếu giữ
 */

/**
 * @swagger
 * /reservations/librarian/list:
 *   get:
 *     summary: Thủ thư xem danh sách tất cả phiếu giữ
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Trạng thái phiếu giữ hoặc chi tiết giữ cần lọc
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu lọc (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc lọc (YYYY-MM-DD)
 *       - in: query
 *         name: userKeyword
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm bạn đọc (ID, tên, hoặc số điện thoại)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Thứ tự sắp xếp theo ngày tạo (mặc định DESC)
 *     responses:
 *       200:
 *         description: Danh sách phiếu giữ cho thủ thư
 */

/**
 * @swagger
 * /reservations/librarian/user/{user_id}:
 *   get:
 *     summary: Thủ thư xem lịch sử phiếu giữ của một bạn đọc cụ thể
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bạn đọc cần xem lịch sử giữ
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái chi tiết giữ
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu lọc (không bắt buộc)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc lọc (không bắt buộc)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Thứ tự sắp xếp theo ngày tạo
 *     responses:
 *       200:
 *         description: Lịch sử phiếu giữ của bạn đọc
 */

/**
 * @swagger
 * /reservations/{id}/confirm:
 *   patch:
 *     summary: Thủ thư xác nhận phiếu giữ (chuyển sang trạng thái active)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID phiếu giữ cần xác nhận
 *     responses:
 *       200:
 *         description: Xác nhận thành công
 *       404:
 *         description: Không tìm thấy phiếu giữ
 */

/**
 * @swagger
 * /reservations/librarian/detail/{barcode}:
 *   patch:
 *     summary: Thủ thư cập nhật chi tiết giữ (picked_up, cancelled, expired)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã barcode của bản ghi cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: Trạng thái mới
 *                 example: picked_up
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy chi tiết giữ
 */

/**
 * @swagger
 * /reservations/cron/expire:
 *   post:
 *     summary: Tự động hết hạn các phiếu giữ quá hạn (cron job)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đã xử lý hết hạn thành công
 *       500:
 *         description: Lỗi khi thực hiện cron
 */

const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authToken");
const permission = require("../helpers/permission");

const Reservation = require("../models/reservationModel");

const {
  createReservation,
  getUserHoldDetails, // User: chi tiết giữ
  getReservationsForLibrarian, // User: chi tiết phiếu giữ (gồm sách)
  getReservationsForSpecificUser, // Librarian: danh sách phiếu giữ
  confirmReservation, // Librarian: xác nhận phiếu giữ
  updateReservationDetail, // Librarian: cập nhật chi tiết giữ theo barcode
  cancelReservationDetailReader, // Reader: hủy chi tiết giữ
  cancelReservation, // User & Librarian: hủy phiếu giữ
  autoCancelPendingReservations, // Librarian: tự động hủy phiếu giữ pending > 5 ngày
} = require("../controllers/reservationController");

// ================== USER ================== //

// User tạo phiếu giữ
router.post("/", authToken, createReservation);

// User xem chi tiết phiếu giữ (gồm sách)
// 📘 Bạn đọc xem danh sách sách đang giữ
router.get("/my/holds", authToken, getUserHoldDetails);
// Người đọc hủy 1 chi tiết giữ
router.patch(
  "/detail/:detail_id/cancel",
  authToken,
  cancelReservationDetailReader
);

// Người đọc hủy toàn bộ phiếu giữ
router.delete("/:id", authToken, cancelReservation);

// ================== LIBRARIAN ================== //
// 📚 Thủ thư xem danh sách toàn bộ phiếu giữ
router.get(
  "/librarian/list",
  authToken,
  permission.isLibrarian,
  getReservationsForLibrarian
);

// 📚 Thủ thư xem phiếu giữ của 1 bạn đọc cụ thể
router.get(
  "/librarian/user/:user_id",
  authToken,
  permission.isLibrarian,
  getReservationsForSpecificUser
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

router.post(
  "/cron/expire",
  authToken,
  permission.isLibrarian,
  async (req, res) => {
    try {
      const result = await Reservation.expireOverdueReservations();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Cron route: auto-cancel pending > 5 days (librarian)
router.post(
  "/cron/auto-cancel-pending",
  authToken,
  permission.isLibrarian,
  autoCancelPendingReservations
);

module.exports = router;
