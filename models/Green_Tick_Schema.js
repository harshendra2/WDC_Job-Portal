const mongoose = require('mongoose');

const GreenBatchPlaneSchema = new mongoose.Schema({
  batch_name: {
    type: String
  },
  price: {
    type: Number,
  },
  month:{
    type:Number
  },
  
});

module.exports = mongoose.model("VerifiedBatchPlane", GreenBatchPlaneSchema);
