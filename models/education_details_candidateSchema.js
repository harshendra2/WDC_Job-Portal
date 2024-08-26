const { required } = require("joi");
const mongoose=require("mongoose");

const education_details_candidate=new mongoose.Schema({
    highest_education:{
        type:String
    },
    board_represent:{
        type:String
    },
    articles:{
        type:String
    },
    certificates:[
        {
            Certificate:{
                type:String
            },
            image:{
                type:String
            }
        }
    ]

})

module.exports = mongoose.model("candidate_education_details", education_details_candidate);