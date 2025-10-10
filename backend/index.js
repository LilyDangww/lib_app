require("dotenv").config();
const express = require("express");
const cors = require("cors");

const apiRoutes = require("./routes/api");
require("./config/db"); // chỉ cần require để kết nối pool, không cần gán biến

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", apiRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("📚 Welcome to Library API!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
