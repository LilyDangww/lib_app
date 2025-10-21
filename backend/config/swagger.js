// config/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Library Management API",
      version: "1.0.0",
      description: "API documentation for Library Management System",
      contact: {
        name: "Dang Phuong Hue",
        email: "huephuongdang143@gmail.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Local server",
      },
      {
        url: "https://library-api.haly.vn",
        description: "Production server",
      },
    ],
  },
  apis: ["./routes/*.js"], // chỉ ra nơi Swagger sẽ đọc mô tả API
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
