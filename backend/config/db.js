import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

global.useLocalDB = false;
global.localDbPath = path.resolve('db_fallback.json');

// Initialize local DB file if it doesn't exist
if (!fs.existsSync(global.localDbPath)) {
  fs.writeFileSync(global.localDbPath, JSON.stringify({
    users: [],
    restaurants: [],
    orders: []
  }, null, 2));
}

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitedash';
  console.log(`Connecting to MongoDB at: ${uri}`);
  try {
    // Try to connect with a short timeout to prevent hanging if MongoDB is not installed/running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to local JSON database (db_fallback.json).');
    console.warn(`Reason: ${error.message}`);
    global.useLocalDB = true;
  }
};
