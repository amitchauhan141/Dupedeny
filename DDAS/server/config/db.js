const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connectionString = "mongodb+srv://ddasUser:codeCheckers%401659opju@ddascluster.vdb0b.mongodb.net/?retryWrites=true&w=majority&appName=DDASCluster";

    await mongoose.connect(connectionString, {
    });
    console.log('MongoDB connected to Atlas');
  } catch (err) {
    console.error('Error connecting to MongoDB Atlas:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;


