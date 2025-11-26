// backend/routes/categoryRoutes.js
const express = require("express");
const router = express.Router();

const { getCategories } = require("../controllers/categoryController");

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: API quản lý thể loại sách
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy danh sách thể loại sách
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Danh sách thể loại
 */
router.get("/", getCategories);

module.exports = router;
