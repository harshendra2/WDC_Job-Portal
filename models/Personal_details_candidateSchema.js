const { required } = require("joi");
const mongoose=require("mongoose");

const personal_details_candidate=new mongoose.Schema({
    gender:{
        type:String
    },
    age:{
       type:Number
    },
    marriag_status:{
        type:String
    },
    aadhar_number:{
        type:Number
    },
    PAN:{
    type:String
    },
    family_member:{
        type:Number
    },
    father_name:{
        type:String
    },
    son_name:{
        type:String
    },
    spouse_profession:{
        type:String
    }
})

module.exports = mongoose.model("candidate_personal_details", personal_details_candidate);