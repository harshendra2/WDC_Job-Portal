const mongoose = require('mongoose');

const SearchHistory = new mongoose.Schema({
    Company_id:{
       type: mongoose.Schema.Types.ObjectId,
  ref:'company'
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
