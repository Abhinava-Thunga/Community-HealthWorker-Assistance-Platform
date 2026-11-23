import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import healthRecordRoutes from "./routes/healthRecordRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();

// ==========================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ==========================================

// Helmet HTTP security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Gzip / Deflate compression for low-bandwidth rural networks
app.use(compression());

// Cross-Origin Resource Sharing
app.use(cors());

// JSON request body parser
app.use(express.json());

// HTTP request logger
app.use(morgan("dev"));

// Rate limiter for authentication routes (protection against brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 attempts per window
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// SYSTEM STATUS / HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };

  res.status(200).json({
    success: true,
    status: dbState === 1 ? "HEALTHY" : "DEGRADED",
    database: states[dbState] || "Unknown",
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// API ROUTES
// ==========================================

// Pre-flight database connection check for API requests
app.use("/api", (req, res, next) => {
  if (req.path === "/health") return next();
  if (mongoose.connection.readyState === 0) {
    return res.status(503).json({
      success: false,
      message: "Database connection unavailable. Please check that MONGODB_URI is set in Render Environment Variables and that 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.",
    });
  }
  next();
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/health-records", healthRecordRoutes);
app.use("/api/ai", aiRoutes);

// ==========================================
// SERVE FRONTEND (PRODUCTION / UNIFIED DEPLOYMENT)
// ==========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../../web/dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA Fallback for client-side routing in Express 5
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(path.resolve(distPath, "index.html"));
    }
    next();
  });
} else {
  // If web/dist is not present, show backend status
  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      platform: "Community Health Worker Assistance Platform API",
      status: "Operational",
      version: "1.0.0",
      docs: "/api/health",
      message: "Backend API is live! Deploy frontend on Vercel or build web/dist for unified hosting.",
    });
  });
}

// ==========================================
// 404 NOT FOUND (API ROUTES)
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
  });
});

export default app;
