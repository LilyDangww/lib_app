const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const register = async (req, res) => {
  try {
    const { username, gender, email, dob, phone, password } = req.body;

    const existingUser = await User.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    await User.registerUser(username, gender, email, dob, phone, password);
    res.status(201).json({ message: "Register successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Lấy thông tin user + role
    const user = await User.getUserByEmail(email); // 👉 join user_roles + roles
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 2️⃣ Kiểm tra mật khẩu
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3️⃣ Tạo token chứa role_id
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role_id: user.role_id, // 👈 Quan trọng
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 4️⃣ Trả về token + user info
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login };
