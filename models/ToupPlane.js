const mongoose = require('mongoose');

const TopUpPlaneSchema = new mongoose.Schema({
    Subscription_Name:{
      type:String
    },
  plane_name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  search_limit: {
      type: mongoose.Schema.Types.Mixed, // Allows both numbers and strings
      default:500
  },
  cv_view_limit: {
    type: mongoose.Schema.Types.Mixed, // Allows both numbers and strings
    default:200
  },
  job_posting: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("TopUpPlane", TopUpPlaneSchema);
