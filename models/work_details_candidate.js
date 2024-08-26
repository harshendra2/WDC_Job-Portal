const { required } = require("joi");
const mongoose=require("mongoose");

const work_details_candidate=new mongoose.Schema({
    designation:{
        type:String
    },
    company_name:{
     type:String
    },
     industry:{
        type:String
    },
     current_ctc:{
        type:Number
    },
    aspiring_position:{
      type:String
    },
    work_experience:{
        type:Number
    },
    current_report:{
        type:String
    },
    last_reporting:{
        type:String
    },
    career_highlight:{
     type:String
    },
     recognation:{
        type:String
    },
    functions:{
        type:String
    },
    preferred_location:{
        type:String
    },
    current_location:{
      type:String
    },
    resume:{
        type:String
    }
})

module.exports = mongoose.model("candidate_work_details", work_details_candidate);

