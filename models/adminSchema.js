const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require("validator");

const SECRET_KEY = process.env.SECRET_KEY;

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Not Valid Email");
      }
    },
  },
  password: {
    type: String,
    minlength: 6,
  },
  status:{
   type:Boolean,
   default:false
  },
  responsibility:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'responsibilities'
},
tokens: [
    {
      token: {
        type: String
      },
    },
  ],
  OnlineStatus:{
    type:Boolean,
    default:false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Pre-save hook to hash the password
adminSchema.pre("save", async function(next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Method to generate auth token
adminSchema.methods.generateAuthtoken = async function() {
  try {
    const token = jwt.sign({ _id: this._id }, SECRET_KEY, { expiresIn: '1d' });
    this.tokens = this.tokens.concat({ token });
    await this.save();
    return token;
  } catch (error) {
    throw new Error('Token generation failed');
  }
};

const admin = mongoose.model("admin", adminSchema);
module.exports = admin;
