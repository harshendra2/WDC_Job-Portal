const mongoose = require('mongoose');

const PromoteJobSchema = new mongoose.Schema({
  plane_name: {
    type: String,
    default:"Promote Job"
  },
  price: {
    type: Number
  },
  month:{
    type:Number
  }
});

module.exports = mongoose.model("PromotePlane", PromoteJobSchema);
