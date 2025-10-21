/**
 * @swagger
 * tags:
 *   name: Records
 *   description: API endpoints for managing records
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Record:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Mã bản ghi
 *           example: 1
 *         doc_id:
 *           type: integer
 *           description: ID tài liệu mà bản ghi thuộc về
 *           example: 3
 *         location_id:
 *           type: integer
 *           description: ID vị trí lưu trữ
 *           example: 2
 *         status:
 *           type: string
 *           description: Trạng thái của bản ghi (available, borrowed, lost, ...)
 *           example: available
 */

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Retrieve a list of records
 *     tags: [Records]
 *     parameters:
 *       - in: query
 *         name: doc_id
 *         schema:
 *           type: string
 *         description: Filter records by document ID
 *     responses:
 *       200:
 *         description: A list of records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Record'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Retrieve a single record by ID
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The record ID
 *     responses:
 *       200:
 *         description: Record details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Record'
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Create a new record
 *     tags: [Records]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Record'
 *     responses:
 *       201:
 *         description: Record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Record'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /records/{id}:
 *   put:
 *     summary: Update an existing record
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Record'
 *     responses:
 *       200:
 *         description: Record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Record'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /records/{id}:
 *   delete:
 *     summary: Delete a record
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The record ID
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */
const express = require("express");
const router = express.Router();
const {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require("../controllers/recordController");

// ========== Routes cho records ==========

// Lấy danh sách bản ghi (có thể lọc theo doc_id)
router.get("/", getRecords);

// Lấy chi tiết 1 bản ghi
router.get("/:id", getRecordById);

// Thêm bản ghi mới
router.post("/", createRecord);

// Cập nhật bản ghi
router.put("/:id", updateRecord);

// Xóa bản ghi
router.delete("/:id", deleteRecord);

module.exports = router;
