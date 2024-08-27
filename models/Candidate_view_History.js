const mongoose = require('mongoose');

const ViewhHistory = new mongoose.Schema({
    Company_id:{
       type: mongoose.Schema.Types.ObjectId,
  ref:'company'
    },
  Candidate_id: {
     type: mongoose.Schema.Types.ObjectId,
  ref:'candidate'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("CompanyViewHistory", ViewhHistory);
