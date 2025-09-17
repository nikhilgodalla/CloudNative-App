const sequelize = require("./models/index");
const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const mysql = require("mysql2/promise");
const HealthCheck = require("./models/healthcheck");
const ProfilePicUpload = require("./models/profilepicupload");
const winston = require("winston");
const StatsD = require("hot-shots");

const app = express();
const PORT = 8080;

//Logger Config
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports:
    process.env.NODE_ENV === "test"
      ? [
          // Use console transport for tests
          new winston.transports.Console({
            level: "error",
          }),
          new winston.transports.Console(),
        ]
      : [
          // Use file transports for production/development
          new winston.transports.File({
            filename: "/var/log/webapp/error.log",
            level: "error",
          }),
          new winston.transports.File({
            filename: "/var/log/webapp/application.log",
          }),
        ],
});

// Configure StatsD client for metrics
const statsd = new StatsD({
  host: "localhost",
  port: 8125,
  prefix: "webapp.",
});

app.use(express.json({ strict: true }));

AWS.config.update({
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();

// Add middleware to track API calls
app.use((req, res, next) => {
  // Track API request count
  const apiPath = req.path.replace(/\/v1\/file\/[^/]+/, "/v1/file/:id");
  statsd.increment(
    `api.${req.method.toLowerCase()}.${
      apiPath.substring(1).replace(/\//g, "_") || "root"
    }`
  );

  // Start timer for API response time
  const startTime = process.hrtime();

  // Capture response time when request completes
  res.on("finish", () => {
    const hrTime = process.hrtime(startTime);
    const responseTimeMs = hrTime[0] * 1000 + hrTime[1] / 1000000;

    // Log API request details
    logger.info(`API ${req.method} ${apiPath}`, {
      method: req.method,
      path: apiPath,
      status: res.statusCode,
      responseTime: responseTimeMs,
    });

    // Record API response time metric
    statsd.timing(
      `api.${req.method.toLowerCase()}.${
        apiPath.substring(1).replace(/\//g, "_") || "root"
      }.time`,
      responseTimeMs
    );
  });

  next();
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    logger.error("Invalid JSON in request body", { error: err.message });
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    return res.status(400).end();
  }
  next();
});

app.get("/healthz", async (req, res) => {
  // ❌ Reject request if body, query params, or extra headers exist
  if (req.body && Object.keys(req.body).length > 0) {
    logger.warn("Health check rejected - request body not empty");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    return res.status(400).end();
  }

  if (Object.keys(req.query).length > 0) {
    logger.warn("Health check rejected - query parameters present");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    return res.status(400).end();
  }

  try {
    // Track database operation time
    const dbStartTime = process.hrtime();

    await HealthCheck.create({ datetime: new Date() });

    // Calculate and record DB operation time
    const dbHrTime = process.hrtime(dbStartTime);
    const dbTimeMs = dbHrTime[0] * 1000 + dbHrTime[1] / 1000000;
    statsd.timing("db.healthcheck.create.time", dbTimeMs);

    logger.info("Health check successful");

    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.status(200).end();
  } catch (error) {
    logger.error("Health check failed", {
      error: error.message,
      stack: error.stack,
    });
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.status(503).end();
  }
});

app.get("/cicd", async (req, res) => {
  // ❌ Reject request if body, query params, or extra headers exist
  if (req.body && Object.keys(req.body).length > 0) {
    logger.warn("Health check rejected - request body not empty");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    return res.status(400).end();
  }

  if (Object.keys(req.query).length > 0) {
    logger.warn("Health check rejected - query parameters present");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    return res.status(400).end();
  }

  try {
    // Track database operation time
    const dbStartTime = process.hrtime();

    await HealthCheck.create({ datetime: new Date() });

    // Calculate and record DB operation time
    const dbHrTime = process.hrtime(dbStartTime);
    const dbTimeMs = dbHrTime[0] * 1000 + dbHrTime[1] / 1000000;
    statsd.timing("db.healthcheck.create.time", dbTimeMs);

    logger.info("Health check successful");

    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.status(200).end();
  } catch (error) {
    logger.error("Health check failed", {
      error: error.message,
      stack: error.stack,
    });
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.status(503).end();
  }
});

app.all("/healthz", (req, res) => {
  if (req.method !== "GET") {
    logger.warn(`Health check rejected - method ${req.method} not allowed`);
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    return res.status(405).end();
  }
});

// Multer configuration for S3 file upload
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "private",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    },
  }),
});

// 🟢 Upload File API
app.post("/v1/file", upload.single("file"), async (req, res) => {
  try {
    // S3 upload is handled by multer-s3, which already happened
    // Record S3 upload time from multer middleware
    const s3UploadTime = req.file.uploadTime || 0;
    statsd.timing("s3.upload.time", s3UploadTime);

    const { key, originalname } = req.file;

    // Track database operation
    const dbStartTime = process.hrtime();

    // Insert file metadata into the database
    const newFile = await ProfilePicUpload.create({
      filename: key,
      path: `${process.env.S3_BUCKET_NAME}/${key}`,
    });

    // Calculate and record DB operation time
    const dbHrTime = process.hrtime(dbStartTime);
    const dbTimeMs = dbHrTime[0] * 1000 + dbHrTime[1] / 1000000;
    statsd.timing("db.file.create.time", dbTimeMs);

    logger.info("File uploaded successfully", {
      fileId: newFile.id,
      fileName: originalname,
      s3Key: key,
    });

    res.status(201).json({
      file_name: originalname,
      id: newFile.id, // Incremental ID from the database
      url: newFile.path,
      upload_date: new Date().toISOString().split("T")[0], // Format YYYY-MM-DD
    });
  } catch (error) {
    logger.error("File upload failed", {
      error: error.message,
      stack: error.stack,
    });
    console.error(error);
    res.status(400).send();
  }
});

app.get("/v1/file", (req, res) => {
  logger.warn("Invalid file request - no ID provided");
  res.status(400).json({ error: "Bad Request" });
});

app.delete("/v1/file", (req, res) => {
  logger.warn("Invalid file deletion request - no ID provided");
  res.status(400).json({ error: "Bad Request" });
});

app.all("/v1/file", (req, res) => {
  logger.warn(`Method ${req.method} not allowed on /v1/file`);
  res.status(405).json({ error: "Method Not Allowed" });
});

// 🟢 Get File Path API
app.get("/v1/file/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Track database query time
    const dbStartTime = process.hrtime();

    const file = await ProfilePicUpload.findByPk(id);

    // Calculate and record DB query time
    const dbHrTime = process.hrtime(dbStartTime);
    const dbTimeMs = dbHrTime[0] * 1000 + dbHrTime[1] / 1000000;
    statsd.timing("db.file.findByPk.time", dbTimeMs);

    if (!file) {
      logger.warn(`File not found`, { fileId: id });
      return res.status(404).json({ error: "File not found" });
    }

    logger.info("File retrieved successfully", { fileId: id });
    res.status(200).json({
      file_name: file.filename,
      id: file.id,
      url: file.path,
      upload_date: file.uploaded_at.toISOString().split("T")[0], // YYYY-MM-DD format
    });
  } catch (error) {
    logger.error("Failed to retrieve file", {
      error: error.message,
      stack: error.stack,
      fileId: req.params.id,
    });
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve file path" });
  }
});

app.delete("/v1/file/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Track database query time
    const dbStartTime = process.hrtime();

    const file = await ProfilePicUpload.findByPk(id);

    // Calculate and record DB query time
    const dbHrTime = process.hrtime(dbStartTime);
    const dbTimeMs = dbHrTime[0] * 1000 + dbHrTime[1] / 1000000;
    statsd.timing("db.file.findByPk.time", dbTimeMs);

    if (!file) {
      logger.warn(`File not found for deletion`, { fileId: id });
      return res.status(404).send();
    }

    // Track S3 operation time
    const s3StartTime = process.hrtime();

    // Delete from S3
    await s3
      .deleteObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: file.filename,
      })
      .promise();

    // Calculate and record S3 operation time
    const s3HrTime = process.hrtime(s3StartTime);
    const s3TimeMs = s3HrTime[0] * 1000 + s3HrTime[1] / 1000000;
    statsd.timing("s3.delete.time", s3TimeMs);

    // Track database delete operation
    const dbDeleteStartTime = process.hrtime();

    // Delete from database
    await ProfilePicUpload.destroy({ where: { id } });

    // Calculate and record DB delete time
    const dbDeleteHrTime = process.hrtime(dbDeleteStartTime);
    const dbDeleteTimeMs =
      dbDeleteHrTime[0] * 1000 + dbDeleteHrTime[1] / 1000000;
    statsd.timing("db.file.delete.time", dbDeleteTimeMs);

    logger.info("File deleted successfully", { fileId: id });

    res.status(204).send();
  } catch (error) {
    logger.error("File deletion failed", {
      error: error.message,
      stack: error.stack,
      fileId: req.params.id,
    });
    console.error(error);
    res.status(500).json({ error: "File deletion failed" });
  }
});

app.all("/v1/file/:id", (req, res) => {
  logger.warn(`Method ${req.method} not allowed on /v1/file/:id`);
  res.status(405).json({ error: "Method Not Allowed" });
});

// 🛑 Prevent running the server during tests
if (process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      await sequelize.authenticate();
      logger.info("Database connection established successfully");
      console.log("Connection to MySQL has been established successfully.");
      await sequelize.sync({ alter: true });
      logger.info("Database synchronized");
      console.log("Database synchronized!");

      app.listen(PORT, () => {
        logger.info(`Server started on port ${PORT}`);
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    } catch (error) {
      logger.error("Database connection failed", {
        error: error.message,
        stack: error.stack,
      });
      console.error("Unable to connect to the database:", error);
      process.exit(1);
    }
  })();
}

module.exports = app;
