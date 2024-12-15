const mongoose = require('mongoose');

const SearchHistory = new mongoose.Schema({
    Candidate_id:{
       type: mongoose.Schema.Types.ObjectId,
  ref:'candidate'
    },
    Search_text: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("searchhistory", SearchHistory);
