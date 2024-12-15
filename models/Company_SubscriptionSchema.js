const { required, number } = require('joi');
const mongoose = require('mongoose');

const CompanySubscriptionPlaneSchema = new mongoose.Schema({
 company_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'company'
  },
  subscription_id:{
 type: mongoose.Schema.Types.ObjectId,
        ref:'SubscriptionPlane'
  },
  plane_name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  transaction_Id:{
    type:String
  },
  search_limit: {
      // type: mongoose.Schema.Types.Mixed, // Allows both numbers and strings
      type:Number,
      default:500
  },
  available_candidate: {
    type: Boolean,
    default: false
  },
  user_access: {
    // type: mongoose.Schema.Types.Mixed, 
    type:Number,
    default:1
  },
  cv_view_limit: {
   // type: mongoose.Schema.Types.Mixed, // Allows both numbers and strings
   type:Number,
    default:0
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
  },
  ai_question:{
    type:Number,
    default:0
  },
  ai_job_description:{
    type:Number,
    default:0
  },
  candidate_match:{
    type:Boolean,
    default:false
  },
  support:{
    type:Boolean,
    default:true
  },
  createdDate:{
    type:Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: Date.now,
     index: { expires: '30d' }, 
}
});

module.exports = mongoose.model("CompanySubscriptionPlane", CompanySubscriptionPlaneSchema);
