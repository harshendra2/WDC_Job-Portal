const { required, number } = require('joi');
const mongoose = require('mongoose');

const CurrentUserSubscriptionPlaneSchema = new mongoose.Schema({
 candidate_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'candidate'
  },
  custom_id: { type: Number},
  subscription_id:{
 type: mongoose.Schema.Types.ObjectId,
        ref:'CandidateSub'
  },
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
  createdDate:{
    type:Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    index: { expires: '30d' } 
},
paymentMethod:{
  type:String
}
});

module.exports = mongoose.model("CurrentUserSubscriptionPlane", CurrentUserSubscriptionPlaneSchema);
