const { required, number } = require("joi");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); // Add this line to require jwt
const Schema = mongoose.Schema;
const SECRET_KEY = process.env.COMPANYSECRET_KEY;

const CompanySchema = new Schema({
  company_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  overView:{
   type:String,
   required:true
  },
  address:{
  type:String,
  required:true
  },
  industry:{
  type:String,
  required:true
  },
  company_size:{
    type:String,
    required:true
  },
  GST:{
    type:String,
  },
  GST_image:{
    type:String
  },
  PAN:{
    type:String,
  },
  PAN_image:{
    type:String
  },
  website_url:{
   type:String,
   required:true
  },
  location: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  hired_candidate: {
    type: Number,
    required: true,
    default: 0,
  },
  contact_email:{
  type:String
  },
  contact_No:{
   type:Number
  },
  headQuater_add:{
   type:String
  },
  status:{
    type:String,
    default:"Processing"
  },
  message:{
    type:String
  },
  createdAt:{
    type: Date,
    default: Date.now
  }
});

// Method to generate auth token
CompanySchema.methods.generateAuthtoken = async function() {
  try {
    const token = jwt.sign({ _id: this._id }, SECRET_KEY, { expiresIn: '1d' });
    return token;
  } catch (error) {
    throw new Error('Token generation failed');
  }
};

module.exports = mongoose.model("company", CompanySchema);
