const { required, number } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const SECRET_KEY = process.env.SECRET_KEY;

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

// Method to generate auth token
CompnaySchema.methods.generateAuthtoken = async function() {
  try {
    const token = jwt.sign({ _id: this._id }, SECRET_KEY, { expiresIn: '1d' });
    return token;
  } catch (error) {
    throw new Error('Token generation failed');
  }
};