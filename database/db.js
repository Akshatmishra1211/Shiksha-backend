import mongoose from "mongoose";

export const connectDb = async () => {     // when we write export before function we can use the function in another folders like connectDB is used in index.js
  try {
    await mongoose.connect(process.env.MONGO_DB);
    console.log("Database Connected");
  } catch (error) {
    console.log(error);
  }
};
