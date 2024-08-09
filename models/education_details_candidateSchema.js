const { required } = require("joi");
const mongoose=require("mongoose");

const education_details_candidate=new mongoose.Schema({
    highest_education:{
        type:String,
        required:true
    },
    board_represent:{
        type:Number,
        required:true
    },
    articles:{
        type:String
    },
    certificate:{
        type:String
    },
    resume:{
        type:String,
        required:true
    }

})

module.exports = mongoose.model("candidate_education_details", education_details_candidate);