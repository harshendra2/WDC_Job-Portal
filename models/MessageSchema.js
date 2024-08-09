const { required } = require('joi');
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  Issue_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Issue'
  },
  Company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'company'
  },
  Admin_id: {
      type:mongoose.Schema.Types.ObjectId,
      ref:"admin"
  },
  message: {
    type:String,
    required:true
  },
  createdDate:{
    type:Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Message", MessageSchema);
