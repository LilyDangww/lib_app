const isLibrarian = (req, res, next) => {
  if (req.user.role_id !== 2) {
    return res.status(403).json({ message: "Access denied. Librarian only." });
  }
  next();
};

const isReader = (req, res, next) => {
  if (req.user.role_id !== 3) {
    return res.status(403).json({ message: "Access denied. Reader only." });
  }
  next();
};

module.exports = { isLibrarian, isReader };
