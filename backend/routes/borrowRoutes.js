/**
 * @swagger
 * tags:
 *   name: Borrows
 *   description: API quản lý phiếu mượn sách
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Borrow:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 101
 *         user_id:
 *           type: integer
 *           example: 7
 *         borrow_date:
 *           type: string
 *           format: date
 *           example: "2025-10-20"
 *         return_date:
 *           type: string
 *           format: date
 *           example: "2025-10-27"
 *         status:
 *           type: string
 *           enum: [pending, active, closed, overdue]
 *           example: "active"
 *         total_books:
 *           type: integer
 *           example: 2
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2025-10-20T08:30:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2025-10-21T09:15:00Z"
 */

/**
 * @swagger
 * /borrows:
 *   post:
 *     summary: Tạo phiếu mượn mới (gồm cả sách mượn tại chỗ và sách từ phiếu giữ)
 *     description: |
 *       API cho thủ thư hoặc hệ thống tạo phiếu mượn mới.
 *       Ngày mượn (**borrow_date**) tự động lấy thời gian hiện tại, hạn trả (**due_date**) tự động tính = ngày mượn + 35 ngày.
 *
 *       Trong danh sách sách (`records`):
 *       - Nếu là **mượn tại chỗ** → truyền `record_id` (ID bản ghi sách khả dụng).
 *       - Nếu là **mượn từ phiếu giữ** → truyền `reservation_detail_id` (ID chi tiết giữ ở trạng thái `on_hold`).
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - records
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID của bạn đọc mượn sách
 *                 example: 12
 *               records:
 *                 type: array
 *                 description: Danh sách các sách được mượn (tại chỗ hoặc từ phiếu giữ)
 *                 items:
 *                   type: object
 *                   properties:
 *                     record_id:
 *                       type: integer
 *                       description: ID bản ghi sách (nếu mượn tại chỗ)
 *                       example: 21
 *                     reservation_detail_id:
 *                       type: integer
 *                       description: ID chi tiết giữ (nếu mượn từ phiếu giữ)
 *                       example: 19
 *           example:
 *             user_id: 12
 *             records:
 *               - record_id: 21
 *               - reservation_detail_id: 16
 *     responses:
 *       201:
 *         description: Phiếu mượn được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Borrow created successfully"
 *                 borrowId:
 *                   type: integer
 *                   example: 45
 *                 borrow_date:
 *                   type: string
 *                   example: "2025-10-24"
 *                 due_date:
 *                   type: string
 *                   example: "2025-11-28"
 *       400:
 *         description: Thiếu dữ liệu hoặc sách không khả dụng
 *       401:
 *         description: Người dùng chưa đăng nhập
 *       500:
 *         description: Lỗi hệ thống
 */

/**
 * @swagger
 * /borrows/me:
 *   get:
 *     summary: Reader xem danh sách phiếu mượn của mình (lọc theo ngày nếu có)
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-10-01"
 *         description: Ngày bắt đầu lọc
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-10-31"
 *         description: Ngày kết thúc lọc
 *     responses:
 *       200:
 *         description: Danh sách phiếu mượn của user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Borrow'
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /borrows:
 *   get:
 *     summary: Librarian xem tất cả phiếu mượn (lọc theo ngày)
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-10-01"
 *         description: Ngày bắt đầu lọc
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-10-31"
 *         description: Ngày kết thúc lọc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: "active"
 *         description: Lọc theo trạng thái phiếu mượn
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *           example: 7
 *         description: Lọc theo ID người dùng
 *     responses:
 *       200:
 *         description: Danh sách tất cả phiếu mượn
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Borrow'
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /borrows/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái phiếu mượn (active / closed)
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 101
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, closed]
 *                 example: "closed"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái phiếu mượn thành công
 *       404:
 *         description: Không tìm thấy phiếu mượn
 */

/**
 * @swagger
 * /borrows/details/{detailId}/return:
 *   patch:
 *     summary: Trả sách (chi tiết mượn) - phiên bản PATCH
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: detailId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 33
 *         description: ID chi tiết mượn
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condition:
 *                 type: string
 *                 example: "good"
 *               note:
 *                 type: string
 *                 example: "Trả sách nguyên vẹn"
 *     responses:
 *       200:
 *         description: Trả sách thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc trạng thái không cho phép trả
 *       404:
 *         description: Không tìm thấy chi tiết mượn
 */

/**
 * @swagger
 * /borrows/cron/overdue:
 *   post:
 *     summary: Tự động cập nhật quá hạn các chi tiết mượn (set 'expired' nếu quá hạn)
 *     description: Cập nhật trạng thái chi tiết mượn thành 'expired' nếu quá hạn. Phiếu mượn vẫn giữ nguyên (active) nếu còn chi tiết 'on_loan' hoặc 'expired'.
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đã cập nhật quá hạn cho các chi tiết mượn
 *       500:
 *         description: Lỗi hệ thống
 */

const express = require("express");
const router = express.Router();
const permission = require("../helpers/permission");
const authToken = require("../middleware/authToken");
const {
  createBorrow,
  getMyBorrows,
  getAllBorrows,
  getBorrowById,
  returnBook,
  updateBorrowStatus,
  autoUpdateOverdue,
  getBorrowSummary,
  getBorrowSummaryByBook,
} = require("../controllers/borrowController");

// Tạo phiếu mượn (thủ thư)
router.post("/", authToken, permission.isLibrarian, createBorrow);

// Reader xem phiếu mượn của mình
router.get("/me", authToken, getMyBorrows);

// Thủ thư xem tất cả phiếu mượn
router.get("/", authToken, permission.isLibrarian, getAllBorrows);

// Tóm tắt thống kê mượn (thủ thư) - Must be before /:id
router.get(
  "/summary",
  authToken,
  permission.isLibrarian,
  getBorrowSummary
);

// Tóm tắt thống kê mượn theo sách (thủ thư) - Must be before /:id
router.get(
  "/summary/by-book",
  authToken,
  permission.isLibrarian,
  getBorrowSummaryByBook
);

// Trả sách (đã đăng nhập) - Must be before /:id
router.patch("/details/:detailId/return", authToken, returnBook);

// Cập nhật trạng thái phiếu mượn (thủ thư) - Must be before /:id
router.put(
  "/:id/status",
  authToken,
  permission.isLibrarian,
  updateBorrowStatus
);

// Xem chi tiết phiếu mượn (thủ thư) - Must be after more specific routes
router.get("/:id", authToken, permission.isLibrarian, getBorrowById);

// Chạy quá hạn (thủ thư)
router.post(
  "/cron/overdue",
  authToken,
  permission.isLibrarian,
  autoUpdateOverdue
);

module.exports = router;
