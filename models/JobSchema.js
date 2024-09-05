const { required } = require('joi');
const mongoose = require('mongoose');

const CompanyJobSchema = new mongoose.Schema({
 company_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'company'
    },
    applied_candidates: [
      {
        candidate_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'candidate',
          required: true,
        },
        applied_date: {
          type: Date,
          default: Date.now,
        }
      }
    ],   
  Save_id:[{
 type: mongoose.Schema.Types.ObjectId,
        ref:'candidate'
  }],
  Interviewed:[
    {
      candidate_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'candidate',
        required: true,
      },
      applied_date: {
        type: Date,
        default: Date.now,
      }
    }
  ],
  apply_status:{
    type:Boolean,
    default:false
  },
  job_title: {
    type: String
  },
  company_name: {
    type:String
  },
  industry: {
    type:String,
  },
  salary: {
    type:String,
    default:0
  },
  experience: {
    type: mongoose.Schema.Types.Mixed, // Allows both numbers and strings
    default:0
  },
  location: {
    type:String,
    required:true
  },
  job_type: {
    type:String,
    required:true
  },
  work_type: {
    type:String,
    required:true
  },
  skills: {
    type:Array
  },
  education:{
    type:String,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  createdDate:{
    type:Date,
    default: Date.now,
  },
  status:{
    type:Boolean,
    default:true
  },
  admin_verify:{
    type: String,
    enum: ["pending", "verified", "Unverified"],
    default: "pending"
  },
  job_reporting:[
    {
      candidate_ids:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'candidate'
      },
      message:{
        type:String
      },
      reported_date:{
        type:Date,
        default: Date.now
      },
      name:{
        type:String
      }
    }
  ]
});

module.exports = mongoose.model("CompanyJob", CompanyJobSchema);
