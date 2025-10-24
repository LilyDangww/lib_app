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
 *     summary: Reader tạo phiếu mượn mới
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservation_id:
 *                 type: integer
 *                 example: 22
 *               note:
 *                 type: string
 *                 example: "Mượn sách từ phiếu giữ số 22"
 *           example:
 *             reservation_id: 22
 *             note: "Mượn 2 quyển đã đặt giữ"
 *     responses:
 *       201:
 *         description: Tạo phiếu mượn thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Borrow'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
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
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-10-01"
 *         description: Ngày bắt đầu lọc
 *       - in: query
 *         name: to
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
 *     summary: Librarian xem tất cả phiếu mượn
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 * /borrows/return/{detail_id}:
 *   put:
 *     summary: Trả sách (chi tiết mượn)
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: detail_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 33
 *         description: ID chi tiết mượn
 *     requestBody:
 *       required: true
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
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy bản ghi mượn
 */

/**
 * @swagger
 * /borrows/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái phiếu mượn (active / closed / overdue)
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
 *                 enum: [active, closed, overdue]
 *                 example: "closed"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái phiếu mượn thành công
 *       404:
 *         description: Không tìm thấy phiếu mượn
 */

const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authToken");
const {
  createBorrow,
  getMyBorrows,
  getAllBorrows,
  returnBook,
  updateBorrowStatus,
} = require("../controllers/borrowController");

// Reader tạo phiếu mượn
router.post("/", authToken, createBorrow);

// Reader xem phiếu mượn của mình (lọc ngày nếu có)
router.get("/me", authToken, getMyBorrows);

// Librarian xem tất cả phiếu mượn
router.get("/", authToken, getAllBorrows);

// Trả sách (chi tiết mượn)
router.put("/return/:detail_id", authToken, returnBook);

// Cập nhật trạng thái phiếu mượn (active/closed)
router.put("/:id/status", authToken, updateBorrowStatus);

module.exports = router;
