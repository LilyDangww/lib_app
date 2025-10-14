console.log("Permission");
const isLibrarian = (req, res, next) => {
  if (req.user.role_id !== 2) {
    // ví dụ role 2 = librarian
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

module.exports = { isLibrarian };
