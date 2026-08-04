import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

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
    console.error(error);
  }
};

startServer();