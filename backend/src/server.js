import "dotenv/config";

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