const { required } = require("joi");
const mongoose=require("mongoose");

const work_details_candidate=new mongoose.Schema({
     industry:{
        type:String
    },
    aspiring_position:{
      type:String
    },
    current_ctc:{
      type:String
    },
    work_experience:{
        type:Number
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
    },
    skill:{
      type:Array
    },
    Experience:[
        {
          designation:{
            type:String
          },
          companyName:{
            type:String
          },
          CTC:{
            type:Number
          },
          location:{
            type:String
          },
          location_type:{
            type:String
          },
          reporting_structure:{
            type:String
          },
          current_workingStatus:{
            type: mongoose.Schema.Types.Mixed, 
          },
          notice_period:{
            type:Number
          },
          negotiation_day:{
            type:Number
          },
          start_date:{
            type:Date
          },
          End_posistion:{
            type:Boolean
          },
          reliving_letter:{
            type:String
          }
        }
    ]
})

module.exports = mongoose.model("candidate_work_details", work_details_candidate);

