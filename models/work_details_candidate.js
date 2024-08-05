const mongoose=require("mongoose");

const work_details_candidate=new mongoose.Schema({
    work_experience:{
        type:Number,
        required:true
    },
    age:{
        type:Number,
        required:true
    },
    functions:{
        type:String,
        required:true
    },
    articles:{
        type:String,
        required:true
    },
    certificate:{
        type:String,
        required:true
    }
})

module.exports = mongoose.model("candidate_work_details", work_details_candidate);