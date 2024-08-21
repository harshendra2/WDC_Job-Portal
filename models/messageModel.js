const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
refference_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'company'
},
Issue_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref:'Issue'
},
  message: String,
  timestamp: {type: Date, default: Date.now}
});

const messageModel = mongoose.model("Message", messageSchema);
module.exports = messageModel;