const { required, number, defaults } = require("joi");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); // Add this line to require jwt
const Schema = mongoose.Schema;
const SECRET_KEY = process.env.COMPANYSECRET_KEY;

const CompanySchema = new Schema({
  company_name: {
    type: String,
  },
  email: {
    type: String,
  },
  mobile: {
    type: Number,
  },
  overView: {
    type: String,
  },
  industry: {
    type: String,
  },
  company_size: {
    type: String,
  },
  GST: {
    type: String,
  },
  GST_image: {
    type: String,
  },
  PAN: {
    type: String,
  },
  PAN_image: {
    type: String,
  },
  website_url: {
    type: String,
  },
  location: {
    type: String,
  },
  password: {
    type: String,
    minlength: 6,
  },
  hired_candidate: {
    type: Number,
    default: 0,
  },
  contact_email: {
    type: String,
  },
  contact_No: {
    type: Number,
  },
  headQuater_add: {
    type: String,
  },
  profile: {
    type: String,
  },
  status: {
    type: String,
    default: "processing",
  },
  message: {
    type: String,
  },
  self_GST_verify: {
    type: Boolean,
    default: false,
  },
  self_PAN_verify: {
    type: Boolean,
    default: false,
  },
  GST_verify: {
    type: Boolean,
    default: false,
  },
  PAN_verify: {
    type: Boolean,
    default: false,
  },
  company_access_count:{
    type:Number,
    default:1
  },
  Logged_In_count:{
    type:Number,
    default:0
  },
  isRead_profile:[{
    isRead:{
     type:Boolean,
     default:false
    },
    candidate_id:{
       type:mongoose.Schema.Types.ObjectId,
       ref:'candidate'
    }
 }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  verified_batch:[
  {
    batch_name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    orderId:{
     type:Number
    },
    ExpireDate:{
      type: Date
    },
    Date:{
      type:Date,
      default: Date.now,
    },
    paymentMethod:{
      type:String
    }  
  }]
});

// Method to generate auth token
CompanySchema.methods.generateAuthtoken = async function () {
  try {
    const token = jwt.sign({ _id: this._id }, SECRET_KEY, { expiresIn: "1d" });
    return token;
  } catch (error) {
    throw new Error("Token generation failed");
  }
};

module.exports = mongoose.model("company", CompanySchema);
