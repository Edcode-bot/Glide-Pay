// db.js
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://axe_app_db:8j0BAlBEjHGM0hr0@clusterlunaai.rdxe7vj.mongodb.net/axeapp?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Connection string used:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
    process.exit(1);
  }
};

module.exports = connectDB;
