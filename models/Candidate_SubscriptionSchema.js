const mongoose = require('mongoose');

const CandidateSubscriptionSchema = new mongoose.Schema({
  plane_name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  top_candidate: {
      type:Number
  },
  createdAt:{
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("CandidateSub", CandidateSubscriptionSchema);
