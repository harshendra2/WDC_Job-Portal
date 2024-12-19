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
  job_recommandation:{
    type:Number
  },
  resume_write:{
    type:Number
  },
  interview_question:{
    type:Number
  },
  customer_support:{
    type:Boolean,
    default:false
  },
  createdAt:{
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("CandidateSub", CandidateSubscriptionSchema);
