const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ lấy role từ user_roles
    const [rows] = await db.query(
      "SELECT role_id FROM user_roles WHERE user_id = ? LIMIT 1",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: "User has no role assigned" });
    }

    // ✅ gán vào req.user cho permission sử dụng
    req.user = {
      id: decoded.id,
      role_id: rows[0].role_id,
    };

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = authToken;
