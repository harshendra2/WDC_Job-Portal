const { isDate } = require("moment");
const mongoose = require("mongoose");
const CandidateShema = new mongoose.Schema({
  custom_id: { type: Number },
  basic_details: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "candidate_basic_details",
  },
  personal_details: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "candidate_personal_details",
  },
  work_details: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "candidate_work_details",
  },
  education_details: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "candidate_education_details",
  },
  ID:{
    type:String
  },
  OTP: {
    type: Number,
  },
  status: {
    type: String,
    default: "Processing",
  },
  profile: {
    type: String,
  },
  summary: {
    type: String,
  },
  ImportStatus: {
    type: Boolean,
    default:true,
  },
  isRead_profile: [
    {
      isRead: {
        type: Boolean,
        default: false,
      },
      company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "company",
      },
      admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin",
      },
    },
  ],
  message: {
    type: String,
  },
  profile_view_company: [
    {
      company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "company",
      },
      is_read: {
        type: Boolean,
        default: false,
      },
      view_date: {
        type: Date,
      },
    },
  ],
  Interviewed: [
    {
      company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "company",
      },
      feedBack: {
        type: String,
      },
    },
  ],
  StartRating: [
    {
      rating: {
        type: Number,
        default: 0,
      },
      jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CompanyJob",
      },
    },
  ],

  Off_line_offerLetter: [
    {
        company_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "company",
        },
        offer_date: {
          type: Date,
        },
        offer_letter: {
          type: String,
        },
        offer_letter_validity: {
          type: Date,
        },
        offer_accepted_status: {
          type: String,
          enum: ["Processing", "Accepted", "Rejected"],
        },
        hired_date: {
          type: Date,
        },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

CandidateShema.methods.removeExpiredBatches = async function () {
  const currentDate = new Date();

  this.verified_batch = this.verified_batch.filter((batch) => {
    return !batch.ExpireDate || batch.ExpireDate > currentDate;
  });
  await this.save();
};

module.exports = mongoose.model("candidate", CandidateShema);
