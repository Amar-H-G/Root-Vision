import mongoose from "mongoose";

export const mongoConnect = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}`).then(() => {
      console.log("✅ MongoDB connected");
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
  }
};
