process.env.NODE_ENV = "test";

jest.mock("aws-sdk", () => {
  return {
    S3: jest.fn(() => ({
      upload: jest.fn().mockImplementation(() => ({
        promise: () =>
          Promise.resolve({ Location: "https://example.com/test.jpg" }),
      })),
      getObject: jest.fn().mockImplementation(() => ({
        promise: () =>
          Promise.resolve({ Body: Buffer.from("test file content") }),
      })),
    })),
    config: {
      update: jest.fn(),
    },
  };
});

jest.mock("multer-s3", () => {
  return jest.fn().mockImplementation((options) => {
    return {
      _handleFile: (req, file, cb) => {
        cb(null, {
          location: "https://example.com/test.jpg",
          key: "test-key",
          bucket: options.bucket || "test-bucket",
        });
      },
      _removeFile: jest.fn(),
    };
  });
});

const request = require("supertest");
const app = require("../index"); // Import your Express app
const sequelize = require("../models/index"); // Import Sequelize instance

describe("Health Check API Tests", () => {
  // Before running any test, authenticate & sync database
  beforeAll(async () => {
    console.log("🔄 Setting up database connection for tests...");
    try {
      await sequelize.authenticate();
      console.log("✅ Database connected successfully.");
      await sequelize.sync({ alter: true });
      console.log("✅ Tables are synchronized.");
    } catch (error) {
      console.error("❌ Unable to connect to the database:", error);
    }
  });

  // After all tests complete, close the database connection
  afterAll(async () => {
    console.log("🛑 Closing database connection...");
    await sequelize.close();
  });

  test("Should return 200 OK for GET /healthz", async () => {
    const response = await request(app).get("/healthz");
    expect(response.status).toBe(200);
  });

  test("Should return 400 Bad Request if body is present in GET /healthz", async () => {
    const response = await request(app).get("/healthz").send({ key: "value" });

    expect(response.status).toBe(400);
  });

  const unsupportedMethods = ["post", "put", "delete", "patch"];
  unsupportedMethods.forEach((method) => {
    test(`Should return 405 Method Not Allowed for ${method.toUpperCase()} /healthz`, async () => {
      const response = await request(app)[method]("/healthz");
      expect(response.status).toBe(405);
    });
  });
});
