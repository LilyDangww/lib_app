/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API xác thực người dùng (đăng ký, đăng nhập)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: huephuongdang143@gmail.com
 *         password:
 *           type: string
 *           format: password
 *           example: "123456"
 *
 *     AuthRegister:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: huedang
 *         email:
 *           type: string
 *           format: email
 *           example: huephuongdang143@gmail.com
 *         password:
 *           type: string
 *           format: password
 *           example: "123456"
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegister'
 *           example:
 *             username: huedang
 *             email: huephuongdang143@gmail.com
 *             password: 123456
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: huedang
 *                     email:
 *                       type: string
 *                       example: huephuongdang143@gmail.com
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc email đã tồn tại
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập và nhận token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLogin'
 *           example:
 *             email: huephuongdang143@gmail.com
 *             password: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: huedang
 *                     email:
 *                       type: string
 *                       example: huephuongdang143@gmail.com
 *       401:
 *         description: Sai thông tin đăng nhập
 */

const express = require("express");
const router = express.Router();
const { login, register, loginAdmin } = require("../controllers/authController");

router.post("/login", login);
router.post("/register", register);
router.post("/admin/login", loginAdmin);

module.exports = router;
