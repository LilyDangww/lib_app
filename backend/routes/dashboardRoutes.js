/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: API thống kê tổng quan
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         summary:
 *           type: object
 *           properties:
 *             documents_total:
 *               type: integer
 *               example: 1200
 *             documents_active:
 *               type: integer
 *               example: 1150
 *             users_total:
 *               type: integer
 *               example: 450
 *             borrows_total:
 *               type: integer
 *               example: 980
 *             borrows_on_loan:
 *               type: integer
 *               example: 120
 *             borrows_overdue:
 *               type: integer
 *               example: 8
 *             reservations_total:
 *               type: integer
 *               example: 300
 *             reservations_pending:
 *               type: integer
 *               example: 15
 *             reservations_active:
 *               type: integer
 *               example: 40
 *         borrowReturnChart:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-14"
 *               borrow_count:
 *                 type: integer
 *                 example: 23
 *               return_count:
 *                 type: integer
 *                 example: 17
 *         documentsStatus:
 *           type: object
 *           properties:
 *             reserved_pending:
 *               type: integer
 *               example: 30
 *             available:
 *               type: integer
 *               example: 700
 *             on_hold:
 *               type: integer
 *               example: 40
 *             on_loan:
 *               type: integer
 *               example: 120
 *             lost:
 *               type: integer
 *               example: 5
 *         topBooks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               book_name:
 *                 type: string
 *                 example: "Clean Code"
 *               borrow_count:
 *                 type: integer
 *                 example: 53
 *         topUsers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "nguyen.anh"
 *               borrow_total:
 *                 type: integer
 *                 example: 42
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Lấy thống kê tổng quan (bao gồm trạng thái bản ghi và biểu đồ mượn/trả)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Thống kê
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 */

const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");

router.get("/stats", getDashboardStats);

module.exports = router;
