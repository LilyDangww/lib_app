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
 *     summary: Thủ thư thêm bạn đọc mới
 *     description: Tạo tài khoản bạn đọc mới. Chỉ cần nhập tên và số điện thoại (bắt buộc), các trường khác có thể để trống.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - phone
 *             properties:
 *               username:
 *                 type: string
 *                 example: "Đặng Phương Huệ"
 *                 description: Tên bạn đọc (bắt buộc)
 *               phone:
 *                 type: string
 *                 example: "0987654321"
 *                 description: Số điện thoại bạn đọc (bắt buộc)
 *               email:
 *                 type: string
 *                 example: "hue123@example.com"
 *                 description: Email (tùy chọn)
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: "female"
 *                 description: Giới tính (tùy chọn)
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "2004-03-14"
 *                 description: Ngày sinh (tùy chọn, định dạng YYYY-MM-DD)
 *     responses:
 *       201:
 *         description: Tạo bạn đọc thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "User created successfully"
 *               user_id: 12
 *       400:
 *         description: Thiếu dữ liệu hoặc số điện thoại đã tồn tại
 *       403:
 *         description: Không có quyền (chỉ thủ thư được phép)
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
 * /users/self:
 *   put:
 *     summary: Người dùng tự chỉnh sửa thông tin của chính mình
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 maxLength: 15
 *                 description: Số điện thoại mới của người dùng
 *                 example: "0987654321"
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi máy chủ
 */

/**
 * @swagger
 * /users/self:
 *   get:
 *     summary: Xem thông tin cá nhân (joined_at và vai trò)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Thủ thư chỉnh sửa thông tin người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của người dùng cần chỉnh sửa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 maxLength: 15
 *                 description: Số điện thoại mới của người dùng
 *                 example: "0987654321"
 *               is_active:
 *                 type: boolean
 *                 description: Trạng thái hoạt động của người dùng
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi máy chủ
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
const authToken = require("../middleware/authToken");
const permission = require("../helpers/permission");

const {
  createUserByLibrarian,
  registerUser,
  getUserByEmail,
  getUsers,
  getUser,
  editUserSelf,
  editUserByLibrarian,
  removeUser,
  getSelfProfile,
} = require("../controllers/userController");

// CRUD

// Thêm user do thủ thư tạo (mật khẩu mặc định)
router.post("/", permission.isLibrarian, createUserByLibrarian);

// Đăng ký user (reader tự đăng ký)
router.post("/register", registerUser);

// Lấy user theo email
router.get("/email/:email", permission.isLibrarian, getUserByEmail);

// Lấy danh sách user
router.get("/", permission.isLibrarian, getUsers);

// Lấy 1 user theo id
router.get("/:id", permission.isLibrarian, getUser);

// Người dùng tự chỉnh sửa thông tin của chính mình
router.put("/self", authToken, editUserSelf);

// Xem thông tin bản thân (reader hoặc librarian)
router.get("/self", authToken, getSelfProfile);

// Thủ thư chỉnh sửa thông tin người dùng (giới hạn quyền chỉnh sửa)
router.put("/:id", permission.isLibrarian, editUserByLibrarian);

// Xóa user (soft delete)
router.delete("/:id", permission.isLibrarian, removeUser);

module.exports = router;
