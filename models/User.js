const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  wallet: { type: String, default: '' },
  currency: { type: String, default: 'USD' },
  isBackedUp: { type: Boolean, default: false },
  referralId: { type: String, default: '' },
  pin: { type: String, default: '' }  // hashed PIN
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);