import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());

app.use(express.json());

app.use(morgan("dev"));

// Home Route
app.get("/", (req, res) => {

  res.status(200).json({
    success: true,
    message: "Community Health Worker Assistance Platform API",
  });

});

// API Routes
app.use("/api/auth", authRoutes);

// 404 Handler
app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: "API Route Not Found",
  });

});

export default app;