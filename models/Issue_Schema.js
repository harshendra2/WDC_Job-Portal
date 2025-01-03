const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  
  company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'company'
  },
  candidate_id:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'candidate'
  },
  issueCategory: {
    type: String
  },
  Ticket:{
    type:String
  },
  Issue_type: {
    type: String
  },
  description: {
      type:String
  },
  file: {
    type:String
  },
  createdDate:{
    type:Date,
    default: Date.now,
  },
  status:{
    type:String,
    default:"pending"
  },
  solved_date:{
   type:Date
  },
  isRead:{
    type:Boolean,
    default:false
  },
  adminIsRead:{
    type:Boolean,
    default:false
  }
});

module.exports = mongoose.model("Issue", IssueSchema);
