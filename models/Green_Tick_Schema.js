const mongoose = require('mongoose');

const GreenBatchPlaneSchema = new mongoose.Schema({
  batch_name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  month:{
    type:Number
  },
  
});

module.exports = mongoose.model("VerifiedBatchPlane", GreenBatchPlaneSchema);
