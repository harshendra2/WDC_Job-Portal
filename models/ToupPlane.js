const mongoose = require('mongoose');

const TopUpPlaneSchema = new mongoose.Schema({
  plane_name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  search_limit: {
      type: mongoose.Schema.Types.Mixed,
      default:0
  },
  cv_view_limit: {
    type: mongoose.Schema.Types.Mixed,
    default:0
  },
  job_posting: {
    type: mongoose.Schema.Types.Mixed,
    default:0
  },
  
   user_access:{
   type: mongoose.Schema.Types.Mixed,
  default:0
},
ai_question:{
  type:Number,
  default:0
},
ai_job_description:{
  type:Number,
  default:0
},
Credibility_Search:{
  type:Number,
  default:0
}

});

module.exports = mongoose.model("TopUpPlane", TopUpPlaneSchema);
