const mongoose=require("mongoose");

const education_details_candidate=new mongoose.Schema({
    career_details:{
        type:String,
        required:true
    },
    highest_education:{
        type:String,
        required:true
    },
    board_represent:{
        type:Number,
        required:true
    },
    current_report:{
        type:String,
        required:true
    },
    last_reporting:{
        type:String,
        required:true
    }
})

module.exports = mongoose.model("candidate_education_details", education_details_candidate);