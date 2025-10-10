const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authToken"); // import middleware
const {
  addDocument,
  getDocumentsForReaders,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentsForLibrarians,
} = require("../controllers/documentController");

//===========================================================================================
// Public routes
router.get("/", getDocumentsForReaders);
router.get("/:id", getDocumentById);

// Protected routes (cần token)
router.post("/", authToken, addDocument);
router.put("/:id", authToken, updateDocument);
router.delete("/:id", authToken, deleteDocument);
router.get("/librarians", authToken, getDocumentsForLibrarians);

module.exports = router;
