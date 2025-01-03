const mongoose=require("mongoose");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.CANDIDATESECRET_KEY;

const basic_details_candidate=new mongoose.Schema({
    custom_id: { type: Number},
    name:{
        type:String
    },
    email:{
        type:String
    },
    contact_email:{
        type:String
    },
    mobile:{
        type:Number
    },
    linkedIn:{
        type:String
    },
    password:{
        type:String
    },
    other_profile:[
        {
            profile_name:{
                type:String
            },
            link:{
                type:String
            }
        }
    ],
    FG_OTP:{
        type:Number
      },
      FG_OTP_EXP:{
       type:Date
      },
})

// Method to generate auth token
basic_details_candidate.methods.generateAuthtoken = async function() {
    try {
      const token = jwt.sign({ _id: this._id }, SECRET_KEY, { expiresIn: '1d' });
      return token;
    } catch (error) {
      throw new Error('Token generation failed');
    }
  };

module.exports = mongoose.model("candidate_basic_details", basic_details_candidate);