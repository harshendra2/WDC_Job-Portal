const mongoose=require("mongoose");

const personal_details_candidate=new mongoose.Schema({
    marriag_status:{
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