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
      type: mongoose.Schema.Types.Mixed,
      default:0
  },
  cv_view_limit: {
    type: mongoose.Schema.Types.Mixed,
    default:0
  },
  job_posting: {
    type: mongoose.Schema.Types.Mixed,
    default:0
  },
  
user_access:{
  type: mongoose.Schema.Types.Mixed,
  default:0
}
});

module.exports = mongoose.model("TopUpPlane", TopUpPlaneSchema);
