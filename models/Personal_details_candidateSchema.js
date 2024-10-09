const { required } = require("joi");
const mongoose=require("mongoose");

const personal_details_candidate=new mongoose.Schema({
    custom_id: { type: Number},
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
    },
    Pan_verified_status:{
        type:Boolean,
        default:false
    },
    Aadhar_verified_status:{
        type:Boolean,
        default:false
    },
    disability:{
        type:Boolean
    },
    disbility_name:{
        type:String
    },
    location:{
        type:String
    },
    country:{
        type:String
    }
 
})

module.exports = mongoose.model("candidate_personal_details", personal_details_candidate);