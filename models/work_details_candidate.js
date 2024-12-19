const { required } = require("joi");
const mongoose=require("mongoose");

const work_details_candidate=new mongoose.Schema({
    custom_id: { type: Number},
     industry:{
        type:String
    },
    aspiring_position:{
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
    country:{
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
          end_date:{
            type:Date
          },
          End_posistion:{
            type:Boolean,
            default:false
          },
          employee_type:{
          type:String
          },
        }
    ],
    Projects:[
      {
      project_title:{
        type:String
      },
      Project_status:{
        type:String
      },
      Project_duration:{
       type:String
      },
      project_details:{
        type:String
      },
      project_site:{
        type:String
      },
      role:{
        type:String
      },
      skills_used:{
        type:String
      },
      project_url:{
        type:String
      }
      }
    ]
})

module.exports = mongoose.model("candidate_work_details", work_details_candidate);

