const { required } = require("joi");
const mongoose = require("mongoose");

const CompanyJobSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "company",
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
      Shortlist_status: {
        type: Boolean,
        default: false,
      },
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
      short_Candidate:{
            offer_date: {
             type: Date
        },
        offer_letter: {
          type: String,
        },
        offer_accepted_status: {
          type: String,
          enum: ["Processing", "accepted", "rejected"]
        },
        hired_date:{
          type:Date
        }
    },
    },
  ],
  Interviewed: [
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
      rating: {
        type: Number,
        default: 0,
      },
      feedBack: {
        type: String,
      },
      interview_Status: {
        type: Boolean,
        default: false,
      },
    },
  ],
  
  apply_status: {
    type: Boolean,
    default: false,
  },
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
  location: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
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
});

module.exports = mongoose.model("CompanyJob", CompanyJobSchema);
