const mongoose=require('mongoose');
const CompanyJob=require('../../models/JobSchema');
const companySubscription=require('../../models/Company_SubscriptionSchema')
const OnboardCandidate=require('../../models/Onboard_Candidate_Schema');
const basic_details=require('../../models/Basic_details_CandidateSchema');
const personal_details=require('../../models/Personal_details_candidateSchema');
const Counter=require('../../models/CounterSchema');
const Company=require('../../models/Onboard_Company_Schema');
const bcrypt =require('bcryptjs')
const {sendMailToCandidate}=require('../../Service/sendMail');


async function getNextCustomId() {
  const result = await Counter.findOneAndUpdate(
    {_id:'collection'},
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
  );

  return result.sequence_value;
}

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
                company_name:'$companyDetails.company_name',
                email:'$companyDetails.email',
                offer_date: "$Shortlisted.short_Candidate.offer_date",
                offer_validity:"$Shortlisted.short_Candidate.offer_letter_validity",
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
        return res.status(200).json({ message: "No job offer found for this candidate." , creditScore:0,
          data});
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  
  exports.uploadOfferLetter = async (req, res) => {
    const { Name, email, PAN, validity, status, offer_date, hired_date, mobile } = req.body;
    const { cmpId } = req.params;
  
    try {
      if (!req.file) return res.status(400).json({ error: "Please upload an offer letter." });
      if (!email || !Name || !PAN || !validity || !status || !offer_date || !cmpId) {
        return res.status(400).json({ error: "All fields are required." });
      }
  
      const existingCandidate = await basic_details.findOne({ email });
      const company = await Company.findById(cmpId);
      if (!company) return res.status(404).json({ error: "Company not found." });
  
      const offerLetterData = {
        company_id: cmpId,
        offer_date,
        offer_letter: req.file.path,
        offer_letter_validity: validity,
        offer_accepted_status: status,
        hired_date,
      };
  
      const defaultPassword = "Candidate#123";
  
      if (existingCandidate) {
        const updatedCandidate = await OnboardCandidate.findOneAndUpdate(
          { basic_details: existingCandidate._id },
          { $push: { Off_line_offerLetter: offerLetterData } },
          { new: true }
        );
  
        if (updatedCandidate) {
          await sendMailToCandidate(email, Name, company.company_name, defaultPassword);
          return res.status(200).json({ message: "Offer letter uploaded successfully." });
        } else {
          return res.status(404).json({ error: "Candidate not found for updating offer letter." });
        }
      }
  
      // Create new candidate
      const customId = await getNextCustomId('customers');
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
  
      const newBasicDetails = new basic_details({
        name: Name,
        email,
        mobile,
        custom_id: customId,
        password: hashedPassword,
      });
      const savedBasicDetails = await newBasicDetails.save();
  
      const newPersonalDetails = new personal_details({ PAN, custom_id: customId });
      const savedPersonalDetails = await newPersonalDetails.save();
  
      const newOnboardCandidate = new OnboardCandidate({
        custom_id: customId,
        basic_details: savedBasicDetails._id,
        personal_details: savedPersonalDetails._id,
        Off_line_offerLetter: [offerLetterData],
      });
      await newOnboardCandidate.save();
  
      await sendMailToCandidate(email, Name, company.company_name, defaultPassword);
      return res.status(200).json({ message: "Offer letter uploaded successfully." });
  
    } catch (error) {
      return res.status(500).json({ error: "Internal server error." });
    }
  };
  