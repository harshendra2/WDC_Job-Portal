const mongoose=require('mongoose');
const moment=require('moment');
const UserSubscription=require('../../models/Current_Candidate_SubscriptionSchema');
const subscription =require('../../models/Candidate_SubscriptionSchema');
const companyJob=require('../../models/JobSchema');
const Candidate=require('../../models/Onboard_Candidate_Schema');

exports.GetSubscriptionStatus=async(req,res)=>{
    const {userId}=req.params;
    try{
        if(!userId){
            return res.status(400).json({error:"Please provide candidate ID"});
        }
        const CandidateID=new mongoose.Types.ObjectId(userId);

        const existedPlane=await UserSubscription.findOne({
            candidate_id:CandidateID,
            expiresAt: { $gte: new Date() },
            createdDate:{$lte:new Date()}
        })
        let CurrentSubscription;
        if(existedPlane){
            CurrentSubscription=await subscription.findById(existedPlane.subscription_id)
        }
        return res.status(200).send({existedPlane,CurrentSubscription})
        
    }catch(error){
        return res.status(500).json({error:'Internal server error'});
    }
}

exports.GetAllJobStatus=async(req,res)=>{
    const {Time,userId}=req.params;    
    try{  
let data
let count; 
const UserID = new mongoose.Types.ObjectId(userId);
if(Time=='Today'){
const todayStart = moment().startOf('day').toDate();
const todayEnd = moment().endOf('day').toDate();
let temp =await AppliedJobStatus(todayStart,todayEnd,UserID);
data=temp?.data;
count=temp?.count
}else if(Time=='Thisweek'){
  const weekStart = moment().startOf('isoWeek').toDate();
  const weekEnd = moment().endOf('isoWeek').toDate();
  let temp=await AppliedJobStatus(weekStart,weekEnd,UserID);
  data=temp?.data;
  count=temp?.count

}else if(Time=='Thismonth'){
  const monthStart = moment().startOf('month').toDate();
  const monthEnd = moment().endOf('month').toDate();
  let temp =await AppliedJobStatus(monthStart,monthEnd,UserID);
  data=temp?.data;
  count=temp?.count
}else if(Time=='Thisyear'){
  const yearStart = moment().startOf('year').toDate();
  const yearEnd = moment().endOf('year').toDate();
  let temp =await AppliedJobStatus(yearStart,yearEnd,UserID);
  data=temp?.data;
  count=temp?.count
}else if(Time=='All'){
  const yearStart = new Date(0)
  let temp =await AppliedJobStatus(yearStart,new Date(),UserID);
  data=temp?.data;
  count=temp?.count
}
let applied_candidates_count=0;
let shortlisted_candidates_count=0;
let offer_accepted_count=0;
let offer_rejected_count=0;
let offer_processing_count=0;
data.map((item)=>{
  applied_candidates_count+=item?.applied_candidates_count;
  shortlisted_candidates_count+=item?.shortlisted_candidates_count;
  offer_accepted_count+=item?.offer_accepted_count;
  offer_rejected_count+=item?.offer_rejected_count;
  offer_processing_count+=item?.offer_processing_count;
})

return res.status(200).send({applied_candidates_count,shortlisted_candidates_count,offer_accepted_count,offer_rejected_count,offer_processing_count,count});
    }catch(error){
        console.log(error)
        return res.status(500).json({error:"Internal server error"});
    }
}

async function AppliedJobStatus(start,end,UserID){

  const candidate = await Candidate.findById(UserID, {
    profile_view_company:{
        $elemMatch: { view_date: { $gte: start, $lt: end } }
    }
});
let count= candidate?.profile_view_company?.length || 0;

  let data= await companyJob.aggregate([
    {
      $match: { "applied_candidates.candidate_id": UserID,'applied_candidates.applied_date':{$gte:start, $lt:end }}
    },
    {
      $project: {
        applied_candidates_count: {
          $size: {
            $filter: {
              input: {
                $cond: {
                  if: { $isArray: "$applied_candidates" },
                  then: "$applied_candidates", 
                  else: []
                }
              },
              as: "applied",
              cond: { $eq: ["$$applied.candidate_id", UserID] }
            }
          }
        },
        
        shortlisted_candidates_count: {
          $size: {
            $filter: {
              input: {
                $cond: {
                  if: { $isArray: "$Shortlisted" },
                  then: "$Shortlisted", 
                  else: []
                }
              },
              as: "shortlist",
              cond: { $eq: ["$$shortlist.candidate_id", UserID] }
            }
          }
        },
  
        offer_accepted_count: {
          $size: {
            $filter: {
              input: {
                $cond: {
                  if: { $isArray: "$Shortlisted" },
                  then: "$Shortlisted", 
                  else: []
                }
              },
              as: "shortlisted",
              cond: { $eq: ["$$shortlisted.short_Candidate.offer_accepted_status", "Accepted"] }
            }
          }
        },
  
        offer_rejected_count: {
          $size: {
            $filter: {
              input: {
                $cond: {
                  if: { $isArray: "$Shortlisted" },
                  then: "$Shortlisted", 
                  else: []
                }
              },
              as: "shortlisted",
              cond: { $eq: ["$$shortlisted.short_Candidate.offer_accepted_status", "Rejected"] }
            }
          }
        },
  
        offer_processing_count: {
          $size: {
            $filter: {
              input: {
                $cond: {
                  if: { $isArray: "$Shortlisted" },
                  then: "$Shortlisted", 
                  else: []
                }
              },
              as: "shortlisted",
              cond: { $eq: ["$$shortlisted.short_Candidate.offer_accepted_status", "processing"] }
            }
          }
        }
      }
    }
  ]);
return {data,count};
}