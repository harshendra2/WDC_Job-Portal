const { required, number } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CompnaySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  company_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  hired_candidate: {
    type: Number,
    required: true,
    default:0
  },
});
module.exports = mongoose.model("company", CompnaySchema);
