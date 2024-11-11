const mongoose=require('mongoose');
const CompanyJob=require('../../models/JobSchema');
const companySubscription=require('../../models/Company_SubscriptionSchema')


exports.GetCredibilityStatus=async(req,res)=>{
  const {cmpId}=req.params;
  try{
    const ObjectID=new mongoose.Types.ObjectId(cmpId);

    const ExistSub=await companySubscription.find({
      company_id: ObjectID,
      expiresAt: { $gte: new Date() },
      createdDate: { $lte: new Date() },
      Credibility_Search:{$gt:0}
    }).select('Credibility_Search')
     
    return res.status(200).send(ExistSub);
  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.OfferVerifier = async (req, res) => {
    const { companyId, PAN } = req.params;
    try {
      if(!companyId){
        return res.status(400).json({error:"Please provide company ID"});
     }
      const objectId=new mongoose.Types.ObjectId(companyId);

      const possibleSubscriptions=await companySubscription.find({
        company_id: objectId,
        expiresAt: { $gte: new Date() },
        createdDate: { $lte: new Date() },
        Credibility_Search:{$gt:0}
        
      })

      if (!possibleSubscriptions || possibleSubscriptions.length == 0) {
        return res.status(400).json({
          error: 'Subscription not found, please purchase a new subscription plan.'
        });
      }else{
        for (const subscription of possibleSubscriptions) {
          subscription.Credibility_Search -= 1;
          await subscription.save();
        }
      }
      
      const data = await CompanyJob.aggregate([
        { $unwind: '$Shortlisted' },
        { $match: { 'Shortlisted.shorted_status': true } },
        {
          $lookup: {
            from: 'candidates',
            localField: 'Shortlisted.candidate_id',
            foreignField: '_id',
            as: 'candidateDetails'
          }
        },
        { $unwind: '$candidateDetails' },
        {
          $lookup: {
            from: 'candidate_basic_details',
            localField: 'candidateDetails.basic_details',
            foreignField: '_id',
            as: 'basicDetails'
          }
        },
        { $unwind: '$basicDetails' },
        {
          $lookup: {
            from: 'candidate_personal_details',
            localField: 'candidateDetails.personal_details',
            foreignField: '_id',
            as: 'personalDetails'
          }
        },
        { $unwind: '$personalDetails' },
        { $match: { 'personalDetails.PAN': PAN } },
        {
          $lookup: {
            from: 'companies',
            localField: 'company_id',
            foreignField: '_id',
            as: 'companyDetails'
          }
        },
        {
          $group: {
            _id: '$candidateDetails._id',
            candidateDetails: { $first: '$candidateDetails' },
            personalDetails: { $first: '$personalDetails' },
            basicDetails: { $first: '$basicDetails' },
            offers: {
              $push: {
                company_id: "$company_id",
                company_name:'companyDetails.company_name',
                email:'companyDetails.email',
                offer_date: "$Shortlisted.short_Candidate.offer_date",
                offer_status: "$Shortlisted.short_Candidate.offer_accepted_status",
                hired_date: "$Shortlisted.short_Candidate.hired_date"
              }
            }
          }
        },
        {
          $addFields: {
            offersCount: { $size: "$offers" },
            acceptedCount: {
              $size: {
                $filter: {
                  input: "$offers",
                  as: "offer",
                  cond: { $eq: ["$$offer.offer_status", "Accepted"] }
                }
              }
            },
            rejectedCount: {
              $size: {
                $filter: {
                  input: "$offers",
                  as: "offer",
                  cond: { $eq: ["$$offer.offer_status", "Rejected"] }
                }
              }
            },
            averageProcessingTime: {
              $cond: {
                if: { $gt: [{ $size: "$offers" }, 0] },
                then: {
                  $avg: {
                    $map: {
                      input: "$offers",
                      as: "offer",
                      in: { $subtract: ["$$offer.hired_date", "$$offer.offer_date"] }
                    }
                  }
                },
                else: null
              }
            },
            jobSearchFrequency: {
              $cond: {
                if: { $gt: [{ $size: "$offers" }, 0] },
                then: {
                  $divide: [
                    { $subtract: [new Date(), "$candidateDetails.createdAt"] },
                    { $size: "$offers" }
                  ]
                },
                else: null
              }
            }
          }
        },
        {
          $project: {
            'candidateDetails._id': 1,
            'personalDetails.PAN': 1,
            'basicDetails.name': 1,
            'basicDetails.email':1 ,
            'basicDetails.mobile':1,
             offers: 1,
            offersCount: 1,
            acceptedCount: 1,
            rejectedCount: 1,
            averageProcessingTime: 1,
            jobSearchFrequency: 1,
            creditScore: {
              $cond: {
                if: { $and: [{ $gt: ["$offersCount", 0] }, "$averageProcessingTime", "$jobSearchFrequency"] },
                then: {
                  $multiply: [
                    {
                      $add: [
                        { $multiply: [{ $divide: ["$acceptedCount", "$offersCount"] }, 0.2] },
                        { $multiply: [{ $divide: ["$averageProcessingTime", 1000 * 60 * 60 * 24] }, 0.15] }, // Days
                        { $multiply: [{ $divide: ["$jobSearchFrequency", 1000 * 60 * 60 * 24 * 365] }, 0.3] }, // Years
                        { $multiply: [{ $divide: ["$acceptedCount", "$offersCount"] }, 0.15] }
                      ]
                    },
                    1000
                  ]
                },
                else: null
              }
            }
          }
        }
      ]);
      if (data.length > 0) {
        const name = data[0]?.basicDetails?.name || "Unknown";
        return res.status(200).json({
          message: `The PAN user ${name} has ${data[0].offersCount} offers, ${data[0].acceptedCount} accepted, and ${data[0].rejectedCount} rejected.`,
          creditScore: data[0].creditScore,
          data
        });
      } else {
        return res.status(200).json({ message: "No job offer found for this candidate." });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  