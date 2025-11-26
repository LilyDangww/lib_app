// backend/models/categoryModel.js
const pool = require("../config/db");

// Lấy tất cả thể loại đang active
const getAllCategories = async () => {
  const [rows] = await pool.query(
    "SELECT id, category_name FROM categories WHERE is_active = 1 ORDER BY name ASC"
  );
  return rows;
};

module.exports = {
  getAllCategories,
};
