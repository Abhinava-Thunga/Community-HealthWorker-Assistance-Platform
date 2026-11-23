import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from cwd (.env) and backend/.env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("====================================");
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log("====================================");
    });
  } catch (error) {
    console.error("Server Error:", error);
  }
};

startServer();