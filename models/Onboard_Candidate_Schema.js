const mongoose=require("mongoose");
const CandidateShema=new mongoose.Schema({
    basic_details:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'candidate_basic_details'
    },
    personal_details:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'candidate_personal_details'
    },
    work_details:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'candidate_work_details'
    },
    education_details:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'candidate_education_details'
    },
    status:{
        type:String,
        default:"processing"
    },
    message:{
        type:String
    },
    createdAt:{
        type: Date,
        default: Date.now
      }
    
})

module.exports = mongoose.model("candidate", CandidateShema);