const mongoose=require("mongoose");

const basic_details_candidate=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    linkedIn:{
        type:String,
        required:true
    }
})

module.exports = mongoose.model("candidate_basic_details", basic_details_candidate);