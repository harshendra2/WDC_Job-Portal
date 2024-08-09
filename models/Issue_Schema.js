const { required } = require('joi');
const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'company'
  },
  Issue_type: {
    type: String,
    required: true
  },
  description: {
      type:String,
      required:true
  },
  file: {
    type:String,
    required:true
  },
  createdDate:{
    type:Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Issue", IssueSchema);
