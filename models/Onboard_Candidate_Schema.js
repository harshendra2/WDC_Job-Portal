const { isDate } = require("moment");
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
        default:"Processing"
    },
    profile:{
       type:String
    },
    summary:{
        type:String
    },
    isRead_profile:[{
       isRead:{
        type:Boolean,
        default:false
       },
       company_id:{
          type:mongoose.Schema.Types.ObjectId,
          ref:'company'
       }
    }],
    message:{
        type:String
    },
    profile_view_company:[
        {
            company_id:{
               type:mongoose.Schema.Types.ObjectId,
               ref:'company'
            },
            is_read:{
                type:Boolean,
                default:false
            }
        }
    ],

    createdAt:{
        type: Date,
        default: Date.now
      }   
})

module.exports = mongoose.model("candidate", CandidateShema);