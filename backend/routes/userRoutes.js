/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API quản lý người dùng trong thư viện
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password_hash
 *       properties:
 *         id:
 *           type: integer
 *           description: ID tự tăng của người dùng
 *           example: 1
 *         username:
 *           type: string
 *           maxLength: 50
 *           description: Tên đăng nhập của người dùng
 *           example: DangPhuongHue
 *         password_hash:
 *           type: string
 *           maxLength: 255
 *           description: Mật khẩu đã được mã hóa
 *           example: $2b$10$ZKkHkZQ9vJtKZ9wJZ1rGxO1lG8G1E2sN
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: Giới tính của người dùng
 *           example: female
 *         email:
 *           type: string
 *           maxLength: 120
 *           format: email
 *           description: Địa chỉ email của người dùng
 *           example: huephuongdang143@gmail.com
 *         dob:
 *           type: string
 *           format: date
 *           description: Ngày sinh của người dùng (YYYY-MM-DD)
 *           example: 2003-08-14
 *         phone:
 *           type: string
 *           maxLength: 15
 *           description: Số điện thoại của người dùng
 *           example: "0987654321"
 *         is_active:
 *           type: boolean
 *           description: Trạng thái hoạt động (1 = kích hoạt, 0 = vô hiệu)
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Ngày tạo tài khoản
 *           example: 2025-10-21T08:30:00Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Ngày cập nhật thông tin gần nhất
 *           example: 2025-10-21T08:45:00Z
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Tạo người dùng mới do thủ thư thêm
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Tạo user thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Người đọc tự đăng ký tài khoản
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               email:
 *                 type: string
 *                 example: nguyenvana@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */

/**
 * @swagger
 * /users/email/{email}:
 *   get:
 *     summary: Lấy thông tin user theo email
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Email của user cần tìm
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *       404:
 *         description: Không tìm thấy user
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy danh sách toàn bộ người dùng
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Danh sách người dùng được trả về
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Lấy chi tiết người dùng theo ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Chi tiết người dùng
 *       404:
 *         description: Không tìm thấy user
 */

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy user
 */

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Xóa (soft delete) người dùng theo ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy user
 */

const express = require("express");
const router = express.Router();

const {
  createUserByLibrarian,
  registerUser,
  getUserByEmail,
  getUsers,
  getUser,
  editUser,
  removeUser,
} = require("../controllers/userController");

// CRUD
router.post("/", createUserByLibrarian); // Thêm user do thủ thư tạo (mật khẩu mặc định)
router.post("/register", registerUser); // Đăng ký user (reader tự đăng ký)
router.get("/email/:email", getUserByEmail); // Lấy user theo email
router.get("/", getUsers); // Lấy danh sách user
router.get("/:id", getUser); // Lấy 1 user theo id
router.put("/:id", editUser); // Cập nhật user
router.delete("/:id", removeUser); // Xóa user (soft delete)

module.exports = router;
