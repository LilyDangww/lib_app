// backend/controllers/categoryController.js
const Category = require("../models/categoryModel");

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error("getCategories error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách thể loại" });
  }
};

module.exports = {
  getCategories,
};
