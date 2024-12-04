const mongoose = require("mongoose");

const HRSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, minlength: 6 },
  OTP:{type:Number},
  OTPExp_time:{type:Date},

  dashboard: { type: Boolean, default: true },
  hire_candidate: { type: Boolean, default: true },
  create_job: { type: Boolean, default: true },
  creadibility: { type: Boolean, default: true },
  subscription: { type: Boolean, default: true },
  transaction: { type: Boolean, default: true },
  support: { type: Boolean, default: true },
  access_management: { type: Boolean, default: true },

  block_status: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = HRSchema;
