const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  try {
    // Connect to MongoDB (no extra options needed in Mongoose 6+)
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    throw error;
  }
};

module.exports = connectDB;