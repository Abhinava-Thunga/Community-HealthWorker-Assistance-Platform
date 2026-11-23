import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("====================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log("Host:", conn.connection.host);
    console.log("Database:", conn.connection.name);
    console.log("====================================");

    return conn;
  } catch (error) {
    console.error("\n====================================================================");
    console.error("⚠️  MONGODB CLOUD ATLAS CONNECTION NOTICE");
    console.error("Error Details:", error.message);
    console.error("--------------------------------------------------------------------");
    console.error("📌 IF CONNECTING TO MONGODB ATLAS:");
    console.error("   Your current IP address may not be whitelisted in MongoDB Atlas.");
    console.error("   To fix in 1 minute:");
    console.error("   1. Open https://cloud.mongodb.com and log in.");
    console.error("   2. Go to 'Network Access' under Security (left sidebar).");
    console.error("   3. Click 'Add IP Address' -> Select 'Allow Access from Anywhere' (0.0.0.0/0).");
    console.error("   4. Save and wait 30 seconds for changes to take effect.");
    console.error("--------------------------------------------------------------------");
    console.error("📌 IF USING LOCAL MONGODB:");
    console.error("   Set MONGODB_URI=mongodb://127.0.0.1:27017/community-health in backend/.env");
    console.error("====================================================================\n");

    // Attempt local fallback if running
    try {
      console.log("Attempting fallback to local MongoDB instance (127.0.0.1:27017)...");
      const fallbackConn = await mongoose.connect("mongodb://127.0.0.1:27017/community-health", {
        serverSelectionTimeoutMS: 2000,
      });
      console.log("✅ Connected to local fallback MongoDB instance!");
      return fallbackConn;
    } catch {
      // Local fallback unavailable
      console.warn("Local MongoDB fallback unavailable. Running with database offline mode.");
      console.warn("Please whitelist your IP in Atlas or start a local MongoDB instance.");
    }
  }
};

export default connectDB;
