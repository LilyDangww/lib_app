/**
 * @desc    Add a new document
 * @route   POST /api/documents
 * @access  Private (admin/librarian)
 * @param   {Object} req - Express request object
 * @param   {Object} req.body - Request body containing document details
 * @param   {string} req.body.name - Name of the document (required)
 * @param   {number} [req.body.publisher_id] - ID of the publisher (optional)
 * @param   {number} [req.body.published_year] - Year the document was published (optional)
 * @param   {number} req.body.category_id - ID of the category (required)
 * @param   {number} [req.body.page_nums] - Number of pages in the document (optional)
 * @param   {string} [req.body.description] - Description of the document (optional)
 * @param   {Object} res - Express response object
 * @returns {void}
 */

/**
 * @desc    Get documents for reader screen (grid view)
 * @route   GET /api/documents
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} req.query - Query parameters
 * @param   {number} [req.query.page=1] - Page number for pagination (default: 1)
 * @param   {number} [req.query.limit=12] - Number of documents per page (default: 12)
 * @param   {number} [req.query.category_id] - Filter by category ID (optional)
 * @param   {string} [req.query.search] - Search term for filtering documents (optional)
 * @param   {string} [req.query.sort] - Sorting criteria (optional)
 * @param   {Object} res - Express response object
 * @returns {void}
 */
const db = require("../config/db");

const Document = require("../models/documentModel");

const normalizeNullableNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

const normalizeNullableString = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

// @desc    Add a new document
// @route   POST /api/documents
// @access  Private (admin/librarian)
//===========================================================================================
// Thêm sách (chat)
const addDocument = async (req, res) => {
  try {
    const {
      name,
      publisher_id,
      published_year,
      category_id,
      page_nums,
      description,
      image_url,
      cloudinary_id,
      author_ids, // mới: mảng các author_id
    } = req.body;

    const trimmedName = typeof name === "string" ? name.trim() : name;
    // Kiểm tra field bắt buộc
    if (!trimmedName) {
      return res.status(400).json({ message: "Document name is required" });
    }
    const normalizedCategoryId = normalizeNullableNumber(category_id);
    if (!normalizedCategoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    // Validate author_ids nếu có
    let normalizedAuthorIds = undefined;
    if (author_ids !== undefined) {
      if (!Array.isArray(author_ids)) {
        return res.status(400).json({ message: "author_ids must be an array" });
      }
      normalizedAuthorIds = author_ids
        .map((id) => normalizeNullableNumber(id))
        .filter((id) => id !== null);
    }

    // Gọi model
    const newDoc = await Document.addDocument({
      name: trimmedName,
      publisher_id: normalizeNullableNumber(publisher_id),
      published_year: normalizeNullableNumber(published_year),
      category_id: normalizedCategoryId,
      page_nums: normalizeNullableNumber(page_nums),
      description: normalizeNullableString(description),
      image_url: normalizeNullableString(image_url),
      cloudinary_id: normalizeNullableString(cloudinary_id),
      author_ids: normalizedAuthorIds,
    });

    res.status(201).json({
      message: "Document added successfully",
      document: newDoc,
    });
  } catch (error) {
    console.error(error);
    // Nếu lỗi là vi phạm ràng buộc foreign key (category không tồn tại)
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ message: "Invalid category_id, publisher_id, or author_id" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//===========================================================================================
// Sửa document
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      publisher_id,
      published_year,
      category_id,
      page_nums,
      description,
      image_url,
      cloudinary_id,
      author_ids, // mới: mảng các author_id
    } = req.body;

    const trimmedName = typeof name === "string" ? name.trim() : name;
    // Kiểm tra field bắt buộc
    if (!trimmedName) {
      return res.status(400).json({ message: "Document name is required" });
    }
    const normalizedCategoryId = normalizeNullableNumber(category_id);
    if (!normalizedCategoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    // Validate author_ids nếu có
    let normalizedAuthorIds = undefined;
    if (author_ids !== undefined) {
      if (!Array.isArray(author_ids)) {
        return res.status(400).json({ message: "author_ids must be an array" });
      }
      normalizedAuthorIds = author_ids
        .map((id) => normalizeNullableNumber(id))
        .filter((id) => id !== null);
    }

    // Gọi model
    const updatedDoc = await Document.updateDocument(id, {
      name: trimmedName,
      publisher_id: normalizeNullableNumber(publisher_id),
      published_year: normalizeNullableNumber(published_year),
      category_id: normalizedCategoryId,
      page_nums: normalizeNullableNumber(page_nums),
      description: normalizeNullableString(description),
      image_url:
        image_url === undefined
          ? undefined
          : normalizeNullableString(image_url),
      cloudinary_id:
        cloudinary_id === undefined
          ? undefined
          : normalizeNullableString(cloudinary_id),
      author_ids: normalizedAuthorIds,
    });

    if (!updatedDoc) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({
      message: "Document updated successfully",
      document: updatedDoc,
    });
  } catch (error) {
    console.error(error);
    // Nếu lỗi là vi phạm ràng buộc foreign key (category không tồn tại)
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ message: "Invalid category_id, publisher_id, or author_id" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//===========================================================================================
// 📘 Xoá document (chỉ đánh dấu is_active = 0, không xóa vật lý)
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Kiểm tra xem document có tồn tại không
    const document = await Document.getDocumentById(id);
    if (!document) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    // 2️⃣ Gọi hàm model deleteDocument (có kiểm tra record còn hoạt động)
    const deleted = await Document.deleteDocument(id);

    if (!deleted) {
      return res.status(400).json({
        message:
          "Không thể xoá tài liệu: vẫn còn bản ghi đang lưu thông hoặc đang sử dụng.",
      });
    }

    // 3️⃣ Trả phản hồi thành công
    res.status(200).json({
      message:
        "Tài liệu đã được chuyển sang trạng thái không hoạt động (is_active = 0).",
    });
  } catch (error) {
    // ⚠️ Nếu là lỗi nghiệp vụ do throw từ model
    if (
      error.message.includes("bản ghi") ||
      error.message.includes("không thể xóa")
    ) {
      return res.status(400).json({ message: error.message });
    }

    console.error("❌ Error in deleteDocument:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

//===========================================================================================
// Get document by id
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch document by ID
    const document = await Document.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// @desc    Get documents for reader screen (grid view)
// @route   GET /api/documents
// @access  Public
//===========================================================================================
// Lấy danh sách document cho độc giả
const getDocumentsForReaders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const category_id = req.query.category_id || null;
    const search = req.query.search || null;
    const sort = req.query.sort || null;

    const result = await Document.getDocumentsForReaders(
      page,
      limit,
      category_id,
      search,
      sort
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Lấy danh sách document cho thủ thư (bảng)
const getDocumentsForLibrarians = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category_id = req.query.category_id || null;
    const search = req.query.search || null;
    const sort = req.query.sort || null;

    const result = await Document.getDocumentsForLibrarians(
      page,
      limit,
      category_id,
      search,
      sort
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const importDocuments = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const summary = await Document.importDocumentsFromFile(req.file.path);
    res.json(summary);
  } catch (e) {
    res.status(500).json({ message: e.message });
  } finally {
    if (req.file) require("fs").unlink(req.file.path, () => {});
  }
};

const getCategories = async (_req, res) => {
  try {
    const categories = await Document.getCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPublishers = async (_req, res) => {
  try {
    const publishers = await Document.getPublishers();
    res.json(publishers);
  } catch (error) {
    console.error("Error fetching publishers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAuthors = async (_req, res) => {
  try {
    const authors = await Document.getAuthors();
    res.json(authors);
  } catch (error) {
    console.error("Error fetching authors:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getLocations = async (_req, res) => {
  try {
    const locations = await Document.getLocations();
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//===========================================================================================
// Lấy danh sách tất cả bản ghi của một tài liệu
const getDocumentRecords = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra document có tồn tại không
    const document = await Document.getDocumentById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Lấy danh sách records từ Record model
    const Record = require("../models/recordModel");
    const records = await Record.getRecords({ doc_id: id });

    res.json(records);
  } catch (error) {
    console.error("Error fetching document records:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//===========================================================================================
// Lấy tóm tắt thống kê cho tất cả sách
const getBookSummary = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const summary = await Document.getBookSummary(page, limit);
    res.json(summary);
  } catch (error) {
    console.error("Error fetching book summary:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//===========================================================================================
// Thêm nhiều bản ghi cho nhiều sách (bulk create records)
const addRecordsBulk = async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        message: "Records array is required and must not be empty",
      });
    }

    // Basic validation: check required fields
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record.doc_id || !record.barcode) {
        return res.status(400).json({
          message: `Record at index ${i} is missing required fields: doc_id and barcode are required`,
        });
      }
    }

    // Import Record model
    const Record = require("../models/recordModel");
    const result = await Record.createRecordsBulk(records);

    // If all failed, return error status
    if (result.success === 0 && result.failed > 0) {
      return res.status(400).json({
        message: `Không thể tạo bất kỳ bản ghi nào. ${result.failed} bản ghi thất bại.`,
        ...result,
      });
    }

    // Partial success or full success
    const statusCode = result.failed > 0 ? 207 : 201; // 207 Multi-Status for partial success
    res.status(statusCode).json({
      message: `Đã tạo thành công ${result.success} bản ghi${
        result.failed > 0 ? `, ${result.failed} bản ghi thất bại` : ""
      }`,
      ...result,
    });
  } catch (error) {
    console.error("Error in addRecordsBulk:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//===========================================================================================
// Thay đổi trạng thái của một bản ghi (record)
const changeRecordStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status is provided
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Valid status values
    const validStatuses = [
      "available",
      "on_loan",
      "borrowed",
      "reserved_pending",
      "lost",
      "damaged",
      "removed",
      "processing",
    ];

    // Validate status value
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Valid statuses are: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    // Import Record model
    const Record = require("../models/recordModel");

    // Check if record exists
    const existingRecord = await Record.getRecordById(id);
    if (!existingRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Update record status
    const updatedRecord = await Record.updateRecord(id, { status });

    res.json({
      message: "Record status updated successfully",
      record: updatedRecord,
    });
  } catch (error) {
    console.error("Error in changeRecordStatus:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//===========================================================================================
// Lấy danh sách sách liên quan
const getRelatedBooks = async (req, res) => {
  try {
    const { categoryId, excludeId, limit } = req.query;
    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required" });
    }

    const books = await Document.getRelatedBooks({
      categoryId: Number(categoryId),
      excludeId: excludeId ? Number(excludeId) : undefined,
      limit: limit ? Number(limit) : 6,
    });

    res.json(books);
  } catch (err) {
    console.error("getRelatedBooks error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addDocument,
  updateDocument,
  deleteDocument,
  getDocumentById,
  getDocumentsForReaders,
  getDocumentsForLibrarians,
  importDocuments, // added
  getCategories,
  getPublishers,
  getAuthors,
  getLocations,
  getDocumentRecords,
  getBookSummary,
  addRecordsBulk,
  changeRecordStatus,
  getRelatedBooks,
};
