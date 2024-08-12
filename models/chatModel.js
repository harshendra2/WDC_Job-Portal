const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
  members:Array
  },
  {
  timestamps:true
  },
  {Issue_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'Issue'
}}

);

const chatModel = mongoose.model("Chat", chatSchema);
module.exports = chatModel;