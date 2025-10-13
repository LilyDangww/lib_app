// // ============================================
// // CONTROLLER EXAMPLE - controllers/inventoryController.js
// // ============================================
// const InventoryReportModel = require("../models/inventoryModel");
// const ExcelJS = require("exceljs"); // npm install exceljs

// class InventoryController {
//   /**
//    * API: Lấy báo cáo dạng JSON phẳng
//    */
//   static async getInventoryFlat(req, res) {
//     try {
//       const { checkDate, locationId, categoryId } = req.query;
//       const data = await InventoryReportModel.getInventoryReportFlat(
//         checkDate ? new Date(checkDate) : new Date(),
//         locationId ? parseInt(locationId) : null,
//         categoryId ? parseInt(categoryId) : null
//       );

//       res.json({
//         success: true,
//         data: data,
//         total: data.length,
//       });
//     } catch (error) {
//       res.status(500).json({ success: false, error: error.message });
//     }
//   }

//   /**
//    * API: Lấy báo cáo dạng phân cấp
//    */
//   static async getInventoryHierarchical(req, res) {
//     try {
//       const { checkDate, locationId, categoryId } = req.query;
//       const data = await InventoryReportModel.getInventoryReportHierarchical(
//         checkDate ? new Date(checkDate) : new Date(),
//         locationId ? parseInt(locationId) : null,
//         categoryId ? parseInt(categoryId) : null
//       );

//       res.json({
//         success: true,
//         data: data,
//       });
//     } catch (error) {
//       res.status(500).json({ success: false, error: error.message });
//     }
//   }

//   /**
//    * API: Xuất Excel theo kiểu như hình bạn mô tả
//    */
//   static async exportInventoryExcel(req, res) {
//     try {
//       const { checkDate, locationId, categoryId } = req.query;
//       const data = await InventoryReportModel.getInventoryReportHierarchical(
//         checkDate ? new Date(checkDate) : new Date(),
//         locationId ? parseInt(locationId) : null,
//         categoryId ? parseInt(categoryId) : null
//       );

//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet("Kiểm Kê Sách");

//       // Thiết lập tiêu đề
//       worksheet.columns = [
//         { header: "Đầu sách", key: "document", width: 30 },
//         { header: "", key: "location_label", width: 15 },
//         { header: "Bản ghi", key: "record", width: 20 },
//         { header: "Thông tin chung", key: "info", width: 25 },
//         { header: "Tổng số", key: "total", width: 12 },
//         {
//           header: "Tại chỗ (có sẵn, đang mượn)",
//           key: "available_info",
//           width: 25,
//         },
//         { header: "Mất, hỏng", key: "lost_damaged", width: 15 },
//         { header: "Mô tả", key: "description", width: 30 },
//       ];

//       let currentRow = 2;

//       // Duyệt qua từng đầu sách
//       data.forEach((doc) => {
//         const docStartRow = currentRow;

//         // Duyệt qua từng kệ/vị trí
//         doc.locations.forEach((loc, locIndex) => {
//           const locStartRow = currentRow;

//           // Duyệt qua từng bản ghi
//           loc.records.forEach((record, recIndex) => {
//             const row = worksheet.getRow(currentRow);

//             // Cột đầu sách (merge cho tất cả rows của document)
//             if (locIndex === 0 && recIndex === 0) {
//               row.getCell(1).value = doc.document_name;
//             }

//             // Cột vị trí/kệ (merge cho tất cả records của location)
//             if (recIndex === 0) {
//               row.getCell(2).value = loc.location;
//             }

//             // Cột bản ghi
//             row.getCell(3).value =
//               record.barcode || `Record #${record.record_id}`;

//             // Thông tin
//             row.getCell(4).value = `Status: ${record.status}`;

//             // Tại chỗ
//             if (record.status === "available") {
//               row.getCell(6).value = "1";
//             } else if (record.status === "on_loan" && record.borrower_name) {
//               row.getCell(6).value = `Đang mượn: ${record.borrower_name}`;
//             }

//             // Mất hỏng
//             if (record.status === "lost") {
//               row.getCell(7).value = "1";
//             }

//             // Mô tả
//             row.getCell(8).value = record.condition_note || "";

//             currentRow++;
//           });
//         });

//         // Merge cells cho đầu sách
//         if (currentRow > docStartRow + 1) {
//           worksheet.mergeCells(docStartRow, 1, currentRow - 1, 1);
//         }

//         // Thêm dòng tổng kết cho đầu sách
//         const summaryRow = worksheet.getRow(currentRow);
//         summaryRow.getCell(4).value = "Tổng:";
//         summaryRow.getCell(5).value = doc.total_records;
//         summaryRow.getCell(
//           6
//         ).value = `Có sẵn: ${doc.available_count}, Đang mượn: ${doc.on_loan_count}`;
//         summaryRow.getCell(7).value = doc.lost_count;
//         summaryRow.font = { bold: true };
//         summaryRow.fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "FFE0E0E0" },
//         };

//         currentRow++;
//         currentRow++; // Dòng trống giữa các đầu sách
//       });

//       // Gửi file
//       res.setHeader(
//         "Content-Type",
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//       );
//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename=inventory-report-${Date.now()}.xlsx`
//       );

//       await workbook.xlsx.write(res);
//       res.end();
//     } catch (error) {
//       res.status(500).json({ success: false, error: error.message });
//     }
//   }
// }

// module.exports = InventoryController;
