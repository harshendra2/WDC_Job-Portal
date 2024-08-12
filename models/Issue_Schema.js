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
    type:String
  },
  createdDate:{
    type:Date,
    default: Date.now,
  },
  status:{
    type:String,
    default:"pending"
  }
});

module.exports = mongoose.model("Issue", IssueSchema);
