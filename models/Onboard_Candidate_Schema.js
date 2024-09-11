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
    isRead:{
        type:Boolean,
        default:false
    },
    message:{
        type:String
    },
    createdAt:{
        type: Date,
        default: Date.now
      },
    //   experience_Details:[{
    //     designation:{
    //         type:String
    //     },
    //     employee_type:{
    //         type:String
    //     },
    //     companyName:{
    //         type:String
    //     },
    //     location:{
    //         type:String
    //     },
    //     location_type:{
    //         type:String
    //     },
    //     reporting_structure:{
    //         type:String
    //     },
    //     notice_period:{
    //         type:Number
    //     },
    //     negotiation_day:{
    //         type:Number
    //     },
    //     start_date:{
    //         type:Date
    //     },
    //     end_date:{
    //         type: mongoose.Schema.Types.Mixed
    //     },
    //     current_position:{
    //         type:Boolean
    //     }
    //   }]
    
})

module.exports = mongoose.model("candidate", CandidateShema);