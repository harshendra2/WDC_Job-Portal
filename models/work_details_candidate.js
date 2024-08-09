const { required } = require("joi");
const mongoose=require("mongoose");

const work_details_candidate=new mongoose.Schema({
    designation:{
        type:String,
        required:true
    },
    company_name:{
            type:String,
            required:true
    },
     industry:{
        type:String,
        required:true
    },
     current_ctc:{
        type:Number,
        required:true
    },
    aspiring_position:{
      type:String,
      required:true
    },
    work_experience:{
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
    },
    career_highlight:{
     type:String,
     required:true
    },
     recognation:{
        type:String,
        required:true
    },
    functions:{
        type:String,
        required:true
    }
})

module.exports = mongoose.model("candidate_work_details", work_details_candidate);

