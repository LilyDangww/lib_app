/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: API endpoints for managing documents (tài liệu/sách)
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Document:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Mã định danh duy nhất của tài liệu
 *           example: 1
 *         name:
 *           type: string
 *           description: Tên tài liệu hoặc sách
 *           example: "Lập trình Node.js cơ bản"
 *         publisher_id:
 *           type: integer
 *           description: Mã nhà xuất bản (foreign key)
 *           example: 3
 *         published_year:
 *           type: integer
 *           description: Năm xuất bản
 *           example: 2022
 *         category_id:
 *           type: integer
 *           description: Mã thể loại (foreign key)
 *           example: 5
 *         page_nums:
 *           type: integer
 *           description: Số trang
 *           example: 320
 *         description:
 *           type: string
 *           description: Mô tả ngắn gọn về tài liệu
 *           example: "Cuốn sách này giới thiệu tổng quan về Node.js và các ví dụ thực hành."
 *         image_url:
 *           type: string
 *           description: Cloudinary secure URL ảnh bìa
 *           example: "https://res.cloudinary.com/demo/image/upload/v1700000000/library_documents/book_a.jpg"
 *         cloudinary_id:
 *           type: string
 *           description: Cloudinary public_id để quản lý ảnh
 *           example: "library_documents/book_a"
 *         is_active:
 *           type: boolean
 *           description: Tài liệu có đang được kích hoạt (hiển thị) hay không
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2025-10-22T08:00:00Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: 2025-10-22T09:15:00Z
 */

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: Lấy danh sách tài liệu cho người đọc
 *     tags: [Documents]
 *     responses:
 *       200:
 *         description: Danh sách tài liệu đang hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 */

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     summary: Lấy chi tiết một tài liệu theo ID
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của tài liệu
 *     responses:
 *       200:
 *         description: Chi tiết tài liệu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       404:
 *         description: Không tìm thấy tài liệu
 */

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Thêm tài liệu mới (chỉ thủ thư)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Sách mới" }
 *               category_id: { type: integer, example: 5 }
 *               publisher_id: { type: integer, example: 3 }
 *               published_year: { type: integer, example: 2024 }
 *               page_nums: { type: integer, example: 250 }
 *               description: { type: string, example: "Mô tả..." }
 *               image: { type: string, format: binary, description: File ảnh (tùy chọn) }
 *     responses:
 *       201: { description: Tạo thành công }
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /documents/{id}:
 *   put:
 *     summary: Cập nhật thông tin tài liệu (chỉ thủ thư)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID tài liệu cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               category_id: { type: integer }
 *               publisher_id: { type: integer }
 *               published_year: { type: integer }
 *               page_nums: { type: integer }
 *               description: { type: string }
 *               image: { type: string, format: binary, description: File ảnh mới (tùy chọn) }
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy tài liệu
 */

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Xóa tài liệu (chỉ thủ thư)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID tài liệu cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy tài liệu
 */

/**
 * @swagger
 * /documents/librarians:
 *   get:
 *     summary: Lấy danh sách tài liệu dành cho thủ thư (bao gồm cả đã ẩn)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đầy đủ của thủ thư
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 */

/**
 * @swagger
 * /documents/import:
 *   post:
 *     summary: Import nhiều tài liệu từ file CSV hoặc XLSX (chỉ thủ thư)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File CSV/XLSX
 *     responses:
 *       200:
 *         description: Kết quả import
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer, example: 10 }
 *                 inserted: { type: integer, example: 8 }
 *                 skipped: { type: integer, example: 2 }
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row: { type: integer, example: 5 }
 *                       message: { type: string, example: "Thiếu tên sách" }
 *       400:
 *         description: Không có file
 *     description: |
 *       Cột tối thiểu: name, category hoặc category_id.
 *       Tùy chọn: publisher, published_year, page_nums, description, image_url, cloudinary_id, authors.
 *       Ví dụ CSV:
 *       name,category,publisher,published_year,page_nums,description,image_url,cloudinary_id,authors
 *       "Book A","Science","Pub X",2022,320,"Mô tả A","https://res.cloudinary.com/demo/image/upload/v1/library_documents/a.jpg","library_documents/a","Tác giả 1;Tác giả 2"
 *       "Book B","Literature","Pub Y",2021,200,"Mô tả B",,,"Tác giả 3"
 */

const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authToken");
const permission = require("../helpers/permission");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
  addDocument,
  getDocumentsForReaders,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentsForLibrarians,
  importDocuments, // added
  getCategories,
  getPublishers,
  getDocumentRecords,
  getBookSummary,
} = require("../controllers/documentController");

// LIST routes (cụ thể) luôn trước route động :id
router.get(
  "/librarians",
  authToken,
  permission.isLibrarian,
  getDocumentsForLibrarians
);
router.get(
  "/summary",
  authToken,
  permission.isLibrarian,
  getBookSummary
);
router.get("/", getDocumentsForReaders);
router.get("/readers", getDocumentsForReaders); // giữ lộ trình cũ để tránh phá vỡ client đang dùng

// Thêm mới / sửa / xóa
router.post(
  "/",
  authToken,
  permission.isLibrarian,
  addDocument
);
router.put(
  "/:id",
  authToken,
  permission.isLibrarian,
  updateDocument
);
router.delete("/:id", authToken, permission.isLibrarian, deleteDocument);

router.post(
  "/import",
  authToken,
  permission.isLibrarian,
  upload.single("file"),
  importDocuments
);

router.get(
  "/categories",
  authToken,
  permission.isLibrarian,
  getCategories
);

router.get(
  "/publishers",
  authToken,
  permission.isLibrarian,
  getPublishers
);

// Lấy danh sách records của một document (phải đặt trước /:id)
router.get(
  "/:id/records",
  authToken,
  permission.isLibrarian,
  getDocumentRecords
);

// Chi tiết (đặt cuối)
router.get("/:id", getDocumentById);

module.exports = router;
