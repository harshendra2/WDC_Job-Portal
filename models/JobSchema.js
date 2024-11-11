const { required } = require("joi");
const mongoose = require("mongoose");

const CompanyJobSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "company",
  },
  Green_Batch:{
  type:Boolean,
  default:false
  },
    Phone_Screening:{
      type:Boolean,
      default:false
    },
    HR_Round:{
      type:Boolean,
      default:false
    },
    Technical_Round:{
      type:Boolean,
      default:false
    },
    Managerial_Round:{
      type:Boolean,
      default:false
    },
    Panel_Round:{
      type:Boolean,
      default:false
    },
    Leadership_Round:{
      type:Boolean,
      default:false
    },
    Project_Round:{
      type:Boolean,
      default:false
    },
    GD_Round:{
      type:Boolean,
      default:false
    },
    Behavioral_Testing:{
      type:Boolean,
      default:false
    },
    Peer_Round:{
      type:Boolean,
      default:false
    },
  applied_candidates: [
    {
      candidate_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "candidate",
        required: true,
      },
      applied_date: {
        type: Date,
        default: Date.now,
      },
      longlist:{
       type:Boolean,
       default:false
      },
      Longlist_Date:{
       type:Date,
       default:Date.now()
      },
      Shortlist_status: {
        type: Boolean,
        default: false,
      },
      user_view:{
       type:Boolean,
       default:false
      },
      interviewRound: [
        {
          roundName: {
            type: String,
            required: true,
          },
          roundAction: {
            type: String, 
            enum: ["Pending","Rejected", "Selected"],
            default: "Pending",
          },
        },
      ],
    },
  ],
  Save_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "candidate",
    },
  ],
   
  Shortlisted: [
    {
      candidate_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "candidate",
        required: true,
      },
      sortlisted_date: {
        type: Date,
        default: Date.now,
      },
      shorted_status: {
        type: Boolean,
        default: false,
      },
      reject_status: {
        type: Boolean,
        default: false,
      },
      feed_back_Status:{
       type:Boolean,
       default:false
      },
      Candidate_feed_back_Status:{
        type:Boolean,
        default:false
       },
         short_Candidate:{
            offer_date: {
             type: Date
           },
           offer_letter: {
          type: String,
           },
           offer_letter_validity:{
             type:Date
           },
          offer_accepted_status: {
          type: String,
          enum: ["Processing", "Accepted", "Rejected"]
           },
           hired_date:{
          type:Date
          }
    },
    },
  ],
  job_title: {
    type: String,
  },
  industry: {
    type: String,
  },
  salary: {
    type: String,
    default: 0,
  },
  experience: {
    type: mongoose.Schema.Types.Mixed, // Allows both numbers and strings
    default: 0,
  },
  No_openings: {
    type: Number,
  },
  hired_Candidate:{
    type:Number,
    default:0
  },
  location: {
    type: String,
    required: true,
  },
  country: {
    type: String,
  },
  job_type: {
    type: String,
    required: true,
  },
  work_type: {
    type: String,
    required: true,
  },
  skills: {
    type: Array,
  },
  education: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  job_Expire_Date: {
    type: Date,
  },
  status: {
    type: Boolean,
    default: true,
  },
  promote_job:{
    type:Boolean,
    default:false
  },
  admin_verify: {
    type: String,
    enum: ["pending", "verified", "Unverified"],
    default: "pending",
  },
 
});

module.exports = mongoose.model("CompanyJob", CompanyJobSchema);


 // job_reporting: [
  //   {
  //     candidate_ids: {
  //       type: mongoose.Schema.Types.ObjectId,
  //       ref: "candidate",
  //     },
  //     message: {
  //       type: String,
  //     },
  //     reported_date: {
  //       type: Date,
  //       default: Date.now,
  //     },
  //     name: {
  //       type: String,
  //     },
  //   },
  // ],