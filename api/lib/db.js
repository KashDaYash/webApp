// api/lib/db.js
const mongoose = require('mongoose');

let isConnected = false;

module.exports = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("DB Error:", error);
  }
};
