const Company=require('../../models/Onboard_Company_Schema');
const candidate=require('../../models/Onboard_Candidate_Schema');
const companyjob=require('../../models/JobSchema');
const CompanySubscriptionPlane=require('../../models/Company_SubscriptionSchema');

exports.getCountofCandidate=async(req,res)=>{
    try{
        const companyCount = await Company.countDocuments({});
    const candidateCount = await candidate.countDocuments({});
    const totalJobCount = await companyjob.countDocuments({});
    const subscriptionPlanCounts = await CompanySubscriptionPlane.aggregate([
        {
          $group: {
            _id: "$plane_name",
            count: { $sum: 1 } 
          }
        }
      ]);

    return res.status(200).json({
      companyCount,
      candidateCount,
      totalJobCount,
      subscriptionPlanCounts
    });

    }catch(error){
        console.log(error);
        return res.status(500).json({error:"Internal server error"});
    }
}