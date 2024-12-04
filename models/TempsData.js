const mongoose = require('mongoose');

const UserDataSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  name: {
    type: Number,
    required: true
  },
  mobile: {
      type:Number,
      default:0
  },
  linkedin: {
    type:String,
    default:0
  },
  city:{
    type:String
  },
  state:{
    type:String
  },
  age:{
    type:Number
  },
  edu_skills:{
     type: mongoose.Schema.Types.ObjectId,
        ref:'candidate_edu'
  }
}, { collection: 'candidate_basic' });

module.exports = mongoose.model("candidate_basic", UserDataSchema);
