const { required, number, defaults, ref } = require("joi");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); // Add this line to require jwt
const Schema = mongoose.Schema;
const SECRET_KEY = process.env.COMPANYSECRET_KEY;
const HRSchema=require('./HrSchema');

const CompanySchema = new Schema({
  company_name: {
    type: String,
  },
  HRs: [HRSchema],
  email:{
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
  block_status:{
    type:Boolean,
    default:false
  },
  Attempt_count:{
   type:Number,
   default:0
  },
  ImportStatus:{
    type:Boolean,
    default:true
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
  isView:{
    type:Boolean,
    default:false
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
    },
    admin_id:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'admin'
    }
 }],
  verified_batch:[
  {
    batch_name: {
      type: String
    },
    price: {
      type: Number
    },
    orderId:{
     type:String
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
  }],
  Candidate_Feed_Back:[
    {
     candidate_id:{
 type:mongoose.Schema.Types.ObjectId,
       ref:'candidate'
     },
     rating:{
      type:Number
     },
     Feedback:{
      type:String
     }
    }
  ],
  resume_download_count:[
    {
     download_count:{
      type:Number,
      default:0
     },
     Date:{
      type:Date,
      default: Date.now
     }
    }
  ],
  Email_download_count:[
    {
     download_count:{
      type:Number,
      default:0
     },
     Date:{
      type:Date,
      default: Date.now
     }
    }
  ],
  view_CV:[
    {
      View:{
        type:Number,
        default:0
      },
      Date:{
        type:Date,
        default: Date.now
       }
    }
  ],
  // OTP:{
  //   type:Number
  // },
  // OTPExp_time:{
  //   type:Date
  // },
  FG_OTP:{
    type:Number
  },
  FG_OTP_EXP:{
   type:Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Method to generate auth token
CompanySchema.methods.generateAuthtoken = async function () {
  try {
    const token = jwt.sign({ _id: this._id,name:this.company_name}, SECRET_KEY, { expiresIn: "1d" });
    return token;
  } catch (error) {
    throw new Error("Token generation failed");
  }
};

CompanySchema.methods.removeExpiredBatches = async function() {
  const currentDate = new Date();
  
  this.verified_batch = this.verified_batch.filter(batch => {
    return !batch.ExpireDate || batch.ExpireDate > currentDate;
  });
  await this.save();
};

module.exports = mongoose.model("company", CompanySchema);
