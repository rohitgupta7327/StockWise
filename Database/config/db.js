const mongoose = require('mongoose');

// Resolves Windows ISP SRV DNS lookup in a single line
require('node:dns').setServers?.(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`\n✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Failed: ${error.message}`);
  }
};

module.exports = connectDB;
