const moment=require('moment');
const Company=require('../../models/Onboard_Company_Schema');
const candidate=require('../../models/Onboard_Candidate_Schema');
const companyjob=require('../../models/JobSchema');
const companyTransaction=require('../../models/CompanyTransactionSchema');
const CandidateTransaction=require('../../models/CandidateTransactionSchema');
const Support=require('../../models/Issue_Schema');
const Admin=require('../../models/adminSchema');
const CandidateSubs=require('../../models/Candidate_SubscriptionSchema')
const CompanySubs=require('../../models/SubscriptionSchema')
const CurrentCandidateSub=require('../../models/Current_Candidate_SubscriptionSchema');
const CurrentCompanySub=require('../../models/Company_SubscriptionSchema');

exports.getCountofCandidate = async (req, res) => {
  try {
    let companyData = await Company.find({});
    let candidateData = await candidate.find({}).populate('personal_details');
    
    let companyCount = companyData.length;  //This is one fils
    let candidateCount = candidateData.length;// this is on e
    
    let verifiedCompany = companyData.filter((temp) => temp.status === "approve").length;
    
    let verifiedCandidate = candidateData.filter(
      (item) => item.personal_details?.Aadhar_verified_status === true &&
                item.personal_details?.Pan_verified_status === true
    ).length;
  

      const data = await companyjob.aggregate([
        {
          $lookup: {
            from: 'companies',       
            localField: 'company_id',   
            foreignField: '_id',      
            as: 'companyDetails'   
          }
        },
        {
          $unwind: '$Shortlisted'     
        },
        {$match:{'Shortlisted.shorted_status':true}},
        {
            $lookup: {
              from: 'candidates',            
              localField: 'Shortlisted.candidate_id',     
              foreignField: '_id',         
              as: 'candidate'    
            }
          },
          {
            $lookup: {
              from: 'candidate_basic_details',       
              localField: 'candidate.basic_details',
              foreignField: '_id',        
              as: 'basicDetails'        
            }
          },
        {
          $project: {
            company_id: 1, 
            basicDetails:{
                name:1
            },              
            companyDetails: {      
              _id: 1,
              company_name: 1                  
            },
            'Shortlisted.candidate_id': 1,
            'Shortlisted.short_Candidate.offer_accepted_status': 1,
            'Shortlisted.short_Candidate.offer_date': 1,
            'Shortlisted.short_Candidate.hired_date': 1
          }
        }
      ]);
      let Accepted=0;
      let  Rejected=0;
      let Processing=0;
      let TotalOfferReleased=0;
      data.map((count)=>{
        if(count?.Shortlisted?.short_Candidate?.offer_accepted_status=="Processing"){
          Processing+=1;
        }else if(count?.Shortlisted?.short_Candidate?.offer_accepted_status=="Accepted"){
          Accepted+=1;
        }else{
          Rejected+=1;
        }

      })
      TotalOfferReleased=Accepted+Rejected+Processing;

      const Job = await companyjob.aggregate([
        {
            $group: {
                _id: '$company_id',
                jobCount: { $sum: 1 },
                activeJobCount: {
                    $sum: { $cond: [ {
                      $and: [
                          { $eq: ['$status',true] },
                          {
                              $gt: [
                                  '$job_Expire_Date',
                                  new Date()
                              ]
                          }
                      ]
                  }, 1, 0] }
                },
                inactiveJobCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$status', false] },
                                    {
                                        $lt: [
                                            '$job_Expire_Date',
                                            new Date()
                                        ]
                                    }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const supports=await Support.find({});
    let TotalSupportRaised=0;
    let TotalIssueSolved=0;
    let TotalIssueRejected=0;
    let TotalIssuePending=0;
    supports.map((item)=>{
      TotalSupportRaised+=1;
      if(item?.status=='solved'){
        TotalIssueSolved+=1;
      }else if(item?.status=='pending'){
        TotalIssuePending+=1;
      }else{
        TotalIssueRejected+=1;
      }
    })
    let SupportData={
      TotalSupportRaised,TotalIssueSolved,TotalIssueRejected,TotalIssuePending
    }
    const adminTeam={}
    const admin=await Admin.find({}).populate({path:'responsibility',select:'role'}).select('responsibility');
    admin.map((item)=>{
      let roleName=item?.responsibility?.role;
      if(!adminTeam[roleName]){
        adminTeam[roleName]=0;
      }
      adminTeam[roleName]+=1
    })

      return res.status(200).send({
          companyCount,
          candidateCount,
          verifiedCompany,
          verifiedCandidate,
          adminTeam,
           //
          Accepted, // remove
          Rejected, // remove
          Processing,// remove
          TotalOfferReleased, // remove
          //
          Job,
          SupportData,
      });


  } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
  }
};

exports.GetAllSubscriptionplane = async (req, res) => {
  const {start,end } = req.params;
  try {
    let data = [];
    let candidateData = [];
    let PainAndUnpaidUser;
    let credibilityEstablish
  
    // if (calendar === 'All' || calendar === null) {
    //   const yearStart = new Date(0)
    // let temp=await GetALLfilterData(yearStart,new Date());
    // data=temp?.data;
    // candidateData=temp?.candidateData;
    // PainAndUnpaidUser=temp?.PainAndUnpaidUser;
    // credibilityEstablish=temp?.credibilityEstablish
    // } else if (calendar === 'Today') {
      const todayStart = moment().startOf('day').toDate();
      const todayEnd = moment().endOf('day').toDate();
      let temp=await GetALLfilterData(start,end);
      data=temp?.data;
      candidateData=temp?.candidateData;
      PainAndUnpaidUser=temp?.PainAndUnpaidUser;
      credibilityEstablish=temp?.credibilityEstablish;
    // } else if (calendar === 'Thisweek') {
    //   const weekStart = moment().startOf('isoWeek').toDate();
    //   const weekEnd = moment().endOf('isoWeek').toDate();
    //   let temp=await GetALLfilterData(weekStart,weekEnd);
    //   data=temp?.data;
    //   candidateData=temp?.candidateData;
    //   PainAndUnpaidUser=temp?.PainAndUnpaidUser;
    //   credibilityEstablish=temp?.credibilityEstablish
    // } else if (calendar === 'Thismonth') {
    //   const monthStart = moment().startOf('month').toDate();
    //   const monthEnd = moment().endOf('month').toDate();
    //   let temp=await GetALLfilterData(monthStart,monthEnd);
    //   data=temp?.data;
    //   candidateData=temp?.candidateData;
    //   PainAndUnpaidUser=temp?.PainAndUnpaidUser;
    //   credibilityEstablish=temp?.credibilityEstablish
    // } else if (calendar === 'Thisyear') {
    //   const yearStart = moment().startOf('year').toDate();
    //   const yearEnd = moment().endOf('year').toDate();

    //   let temp=await GetALLfilterData(yearStart,yearEnd);
    //   data=temp?.data;
    //   candidateData=temp?.candidateData;
    //   PainAndUnpaidUser=temp?.PainAndUnpaidUser;
    //   credibilityEstablish=temp?.credibilityEstablish
    // } else {
    //   return res.status(400).json({ error: 'Invalid calendar filter' });
    // }

    const CandidateSub = await CandidateSubs.find();
    const subscriptionCount = {};
    
    const TopUpCount = {};
    const PromotJob = { price: 0, count: 0 };
    const VerifitionBadge={ price: 0, count: 0 };
    let companyEarning = 0;
    const CompanySub=await CompanySubs.find({});

    CompanySub.forEach((item) => {
      const planName = item?.plane_name;
      subscriptionCount[planName] = { count: 0, totalPrice: 0 };
    });
    data.forEach((item) => {
      if (item?.type === 'Promote job') {
        PromotJob.count += 1;
        PromotJob.price += item?.price || 0;
        companyEarning += item?.price || 0;
      }

      if (item?.type === 'TopUp plane') {
        const planName = item?.Plane_name;
        if (!TopUpCount[planName]) {
          TopUpCount[planName] = { count: 0, totalPrice: 0 };
        }

        TopUpCount[planName].count += 1;
        TopUpCount[planName].totalPrice += item?.price || 0;
        companyEarning += item?.price || 0;
      }

      if (item?.type === 'Subscription') {
        const planName = item?.Plane_name;

        subscriptionCount[planName].count += 1;
        subscriptionCount[planName].totalPrice += item?.price || 0;
        companyEarning += item?.price || 0;
      }

      if (item?.type === 'Green Batch plane') {
        VerifitionBadge.count += 1;
        VerifitionBadge.price += item?.price || 0;
        companyEarning += item?.price || 0;
      }
    });

    let CandidateSubscriptionCount = {};
    let CandidateEarning = 0;
    CandidateSub.forEach((item) => {
      const planName = item?.plane_name;
      CandidateSubscriptionCount[planName] = { count: 0, totalPrice: 0 };
    });

    candidateData.forEach((item) => {
      if (item?.type === 'Subscription') {
        const planName = item?.Plane_name;
       
        CandidateSubscriptionCount[planName].count += 1;
        CandidateSubscriptionCount[planName].totalPrice += item?.price || 0;
        CandidateEarning += item?.price || 0;
      }
    });

    let TotalEarning = companyEarning + CandidateEarning;

    return res.status(200).send({
      subscriptionCount,
      TopUpCount,
      PromotJob,
      VerifitionBadge,
      companyEarning,
      CandidateSubscriptionCount,
      CandidateEarning,
      TotalEarning,

      //Paid and Unpaid User
      PainAndUnpaidUser,
      //credibility establishment
      credibilityEstablish
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function GetALLfilterData(start,end){
  let data = await companyTransaction.find({ purchesed_data: { $gte:start, $lt:end } });
     let candidateData = await CandidateTransaction.find({ purchesed_data: { $gte:start, $lt:end } });
     
     //Get Paid and Unpain User
     
    const [candidateStats, totalCandidates] = await Promise.all([
      CurrentCandidateSub.aggregate([
        { $match: { createdDate: { $gte:start, $lt:end } } },
        { $group: { _id: '$candidate_id' } },
        { $count: 'total' }
      ]),
      candidate.countDocuments()
    ]);

    const CandidatePaidCount = candidateStats.length > 0 ? candidateStats[0].total : 0;
    const UnpaidCount = totalCandidates - CandidatePaidCount;

    // Aggregating paid and unpaid counts for companies
    const [companyStats, totalCompanies] = await Promise.all([
      CurrentCompanySub.aggregate([
        { $match: { createdDate: { $gte:start, $lt:end } } },
        { $group: { _id: '$company_id' } },
        { $count: 'total' }
      ]),
      Company.countDocuments()
    ]);

    const CompanyPaidCount = companyStats.length > 0 ? companyStats[0].total : 0;
    const UnpaidCompanyCount = totalCompanies - CompanyPaidCount;
    let PainAndUnpaidUser={ CandidatePaidCount, 
      UnpaidCount, 
      CompanyPaidCount, 
      UnpaidCompanyCount }

  //Credibility establishment code 

   // Aggregation for shortlisted candidates
   const offersData = await companyjob.aggregate([
    { $unwind: "$Shortlisted" },
    {
      $match: {
        "Shortlisted.short_Candidate": { $exists: true, $ne: null },
        "Shortlisted.short_Candidate.offer_date": { $gte:start, $lt:end },
      },
    },
    {
      $group: {
        _id: null,
        totalOffersCount: { $sum: 1 },
        acceptedOffersCount: {
          $sum: {
            $cond: [
              { $eq: ["$Shortlisted.short_Candidate.offer_accepted_status", "Accepted"] },
              1,
              0,
            ],
          },
        },
        rejectedOffersCount: {
          $sum: {
            $cond: [
              { $eq: ["$Shortlisted.short_Candidate.offer_accepted_status", "Rejected"] },
              1,
              0,
            ],
          },
        },
        processingOffersCount: {
          $sum: {
            $cond: [
              { $eq: ["$Shortlisted.short_Candidate.offer_accepted_status", "Processing"] },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalOffersCount: 1,
        acceptedOffersCount: 1,
        rejectedOffersCount: 1,
        processingOffersCount: 1,
      },
    },
  ]);

  const {
    totalOffersCount = 0,
    acceptedOffersCount = 0,
    rejectedOffersCount = 0,
    processingOffersCount = 0,
  } = offersData.length > 0 ? offersData[0] : {};

  // Aggregation for CV views, downloads, and email downloads
  const viewDownloadStats = await Company.aggregate([
    {
      $project: {
        view_CV: {
          $filter: {
            input: "$view_CV",
            as: "view",
            cond: {
              $and: [
                { $gte: ["$$view.Date",start] },
                { $lte: ["$$view.Date", end] },
              ],
            },
          },
        },
        resume_download_count: {
          $filter: {
            input: "$resume_download_count",
            as: "download",
            cond: {
              $and: [
                { $gte: ["$$download.Date",start] },
                { $lte: ["$$download.Date",end] },
              ],
            },
          },
        },
        Email_download_count: {
          $filter: {
            input: "$Email_download_count",
            as: "email",
            cond: {
              $and: [
                { $gte: ["$$email.Date",start] },
                { $lte: ["$$email.Date",end] },
              ],
            },
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        totalViewCV: { $sum: { $sum: "$view_CV.View" } },
        totalDownloadCount: { $sum: { $sum: "$resume_download_count.download_count" } },
        totalEmailDownloadCount: { $sum: { $sum: "$Email_download_count.download_count" } },
      },
    },
  ]);

  const {
    totalViewCV = 0,
    totalDownloadCount = 0,
    totalEmailDownloadCount = 0,
  } = viewDownloadStats.length > 0 ? viewDownloadStats[0] : {};
let credibilityEstablish={ totalOffersCount,
  acceptedOffersCount,
  rejectedOffersCount,
  processingOffersCount,
  totalViewCV,
  totalDownloadCount,
  totalEmailDownloadCount}

     return {data,candidateData,PainAndUnpaidUser,credibilityEstablish};
}
