const { required } = require("joi");
const mongoose=require("mongoose");

const personal_details_candidate=new mongoose.Schema({
    gender:{
        type:String,
        required:true
    },
    age:{
       type:Number,
       required:true
    },
    marriag_status:{
        type:String,
        required:true
    },
    preferred_location:{
      type:String,
      required:true
    },
    current_location:{
    type:String,
    required:true
    },
    family_member:{
        type:Number,
        required:true
    },
    father_name:{
        type:String,
        required:true
    },
    son_name:{
        type:String,
        required:true
    },
    spouse_profession:{
        type:String,
        required:true
    }
})

module.exports = mongoose.model("candidate_personal_details", personal_details_candidate);