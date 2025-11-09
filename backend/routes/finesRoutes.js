/**
 * @swagger
 * components:
 *   schemas:
 *     Fine:
 *       type: object
 *       description: Thông tin của một phiếu phạt
 *       properties:
 *         id:
 *           type: integer
 *           example: 10
 *         user_id:
 *           type: integer
 *           example: 12
 *         username:
 *           type: string
 *           example: "Nguyễn Văn A"
 *         phone:
 *           type: string
 *           example: "0987654321"
 *         issued_date:
 *           type: string
 *           example: "2025-10-24 09:05:12"
 *         status:
 *           type: string
 *           enum: [unpaid, paid]
 *           example: "unpaid"
 *         total_amount:
 *           type: number
 *           example: 15000
 *         note:
 *           type: string
 *           example: "Vi phạm quá hạn trả sách"
 *         details:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FineDetail'

     FineDetail:
       type: object
       description: Chi tiết tiền phạt của từng quyển sách
       properties:
         id:
           type: integer
           example: 21
         loan_item_id:
           type: integer
           example: 101
         book_title:
           type: string
           example: "Nhà giả kim"
         barcode:
           type: string
           example: "BR000124"
         reason_id:
           type: integer
           example: 1
         reason:
           type: string
           example: "overdue"
         amount:
           type: number
           example: 15000
         meta:
           type: object
           description: Thông tin bổ sung (tự động thêm nếu là quá hạn)
           example:
             days_late: 5

     FineCreateRequest:
       type: object
       required:
         - loan_item_id
         - reason
       properties:
         loan_item_id:
           type: integer
           description: ID của chi tiết mượn (borrow_details.id)
           example: 101
         reason:
           type: string
           enum: [overdue, lost]
           description: |
             - overdue → tính tiền theo bảng quy định overdue_rules  
             - lost → phạt theo giá trị thay thế của sách
           example: "overdue"

     FineCreateResponse:
       type: object
       properties:
         message:
           type: string
           example: "Fine created successfully"
         fine:
           $ref: '#/components/schemas/Fine'
 */

/**
 * @swagger
 * /fines:
 *   post:
 *     summary: Tạo phiếu phạt từ một chi tiết mượn (loan_item)
 *     tags: [Fines]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       API dành cho **thủ thư** tạo phiếu phạt từ một chi tiết mượn.
 *       - Nếu lý do là `overdue` → hệ thống tự tính tiền theo bảng `overdue_rules`
 *       - Nếu lý do là `lost` → tính phí theo giá trị thay thế của sách
 *
 *       Không cho phép bạn đọc tạo phiếu phạt.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loan_item_id
 *               - reason
 *             properties:
 *               loan_item_id:
 *                 type: integer
 *                 description: ID của chi tiết mượn (borrow_details.id)
 *                 example: 101
 *               reason:
 *                 type: string
 *                 enum: [overdue, lost]
 *                 description: Lý do phạt (`overdue` = quá hạn, `lost` = mất sách)
 *                 example: "overdue"
 *     responses:
 *       201:
 *         description: Tạo phiếu phạt thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Fine created successfully"
 *                 fine:
 *                   type: object
 *                   description: Phiếu phạt vừa được tạo
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     user_id:
 *                       type: integer
 *                       example: 12
 *                     username:
 *                       type: string
 *                       example: "Nguyễn Văn A"
 *                     phone:
 *                       type: string
 *                       example: "0987654321"
 *                     issued_date:
 *                       type: string
 *                       example: "2025-10-25T10:00:00.000Z"
 *                     status:
 *                       type: string
 *                       enum: [unpaid, paid]
 *                       example: "unpaid"
 *                     total_amount:
 *                       type: number
 *                       example: 15000
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           loan_item_id:
 *                             type: integer
 *                             example: 101
 *                           book_title:
 *                             type: string
 *                             example: "Nhà giả kim"
 *                           barcode:
 *                             type: string
 *                             example: "BR000124"
 *                           amount:
 *                             type: number
 *                             example: 15000
 *                           meta:
 *                             type: object
 *                             example: { "days_late": 5 }
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc không có quyền thực hiện
 *       500:
 *         description: Lỗi hệ thống
 */

/**
 * @swagger
 * /fines/{id}:
 *   get:
 *     summary: Xem chi tiết 1 phiếu phạt
 *     tags: [Fines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của phiếu phạt
 *     responses:
 *       200:
 *         description: Chi tiết phiếu phạt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 10
 *                 user_id:
 *                   type: integer
 *                   example: 12
 *                 username:
 *                   type: string
 *                   example: "Nguyễn Văn A"
 *                 phone:
 *                   type: string
 *                   example: "0987654321"
 *                 issued_date:
 *                   type: string
 *                   example: "2025-10-24"
 *                 status:
 *                   type: string
 *                   enum: [unpaid, paid]
 *                   example: "unpaid"
 *                 total_amount:
 *                   type: number
 *                   example: 15000
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       book_title:
 *                         type: string
 *                         example: "Clean Code"
 *                       barcode:
 *                         type: string
 *                         example: "BR00012"
 *                       amount:
 *                         type: number
 *                         example: 15000
 *                       meta:
 *                         type: object
 *                         example: { "days_late": 5 }
 *       404:
 *         description: Không tìm thấy phiếu phạt
 */

const express = require("express");
const router = express.Router();
const {
  createFineFromLoanItem,
  getFine,
} = require("../controllers/finesController");
const authToken = require("../middleware/authToken");
const permission = require("../helpers/permission");

// Thủ thư tạo phiếu phạt từ loan_item
router.post("/", authToken, permission.isLibrarian, createFineFromLoanItem);

// Xem phiếu phạt chi tiết
router.get("/:id", authToken, getFine);

module.exports = router;
