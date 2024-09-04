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
    ],
    Education:[
        {
            school:{
                type:String
            },
            degree:{
                type:String
            },
           Field_study:{
            type:String
           },
           start_date:{
            type:Date
           } ,
           end_date:{
            type:String
           },
           grade:{
            type:String
           },
           description:{
            type:String
           }
        }
    ]

})

module.exports = mongoose.model("candidate_education_details", education_details_candidate);