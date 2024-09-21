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
    type:Number
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
  createdDate:{
    type:Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    // index: { expires: '30d' }, 
},
paymentMethod:{
  type:String
},
// topUp:[
//   {
//     plane_name:{
//       type:String
//     },
//     plane_price:{
//       type:Number
//     },
//     order_Id:{    //order_Id and transaction_id is same it will get when payment time
//       type:Number
//     },
//     ExpireDate:{
//       type: Date
//     },
//     Date:{
//       type:Date,
//       default: Date.now,
//     },
//     paymentMethods:{
//       type:String
//     }
//   }
// ]
});

module.exports = mongoose.model("CompanySubscriptionPlane", CompanySubscriptionPlaneSchema);
