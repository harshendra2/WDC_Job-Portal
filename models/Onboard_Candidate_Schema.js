const { isDate } = require("moment");
const mongoose=require("mongoose");
const CandidateShema=new mongoose.Schema({
    custom_id: { type: Number},
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
    ImportStatus:{
       type:Boolean,
       default:false
    },
    isRead_profile:[{
       isRead:{
        type:Boolean,
        default:false
       },
       company_id:{
          type:mongoose.Schema.Types.ObjectId,
          ref:'company'
       },
       admin_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'admin'
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
            },
            view_date:{
              type:Date
            }
        }
    ],
     Interviewed: [
    {
      company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "company"
      },
      feedBack: {
        type: String,
      }
    }
  ],
  StartRating:[{
   rating:{
    type:Number,
    default:0
   },
   jobId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'CompanyJob'
   }
}],
  verified_batch:[
    {
      batch_name: {
        type: String
      },
      price: {
        type: Number,
        required: true
      },
      orderId:{
       type:Number
      },
      ExpireDate:{
        type: Date
      },
      Date:{
        type:Date,
        default: Date.now,
      },
      paymentMethod:{
        type:String
      }  
    }],
    createdAt:{
        type: Date,
        default: Date.now
      }   
})


CandidateShema.methods.removeExpiredBatches = async function() {
  const currentDate = new Date();
  
  this.verified_batch = this.verified_batch.filter(batch => {
    return !batch.ExpireDate || batch.ExpireDate > currentDate;
  });
  await this.save();
};


module.exports = mongoose.model("candidate", CandidateShema);