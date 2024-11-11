const mongoose = require('mongoose');

const SubscriptionPlaneSchema = new mongoose.Schema({
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
  available_candidate: {
    type: Boolean,
    default: false
  },
  user_access: {
    type: mongoose.Schema.Types.Mixed, // Allows both numbers and strings
    default:1
  },
  cv_view_limit: {
    type: mongoose.Schema.Types.Mixed, // Allows both numbers and strings
    default:200
  },
  download_email_limit: {
    type: Boolean,
    default: false
  },
  download_cv_limit: {
    type: Boolean,
    default: false
  },
  job_posting: {
    type: Number,
    default: 0
  },
  Credibility_Search:{
    type:Number,
    default:0
  }
});

module.exports = mongoose.model("SubscriptionPlane", SubscriptionPlaneSchema);
