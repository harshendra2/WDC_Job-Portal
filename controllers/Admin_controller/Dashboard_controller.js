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

exports.getCountofCandidate = async (req, res) => {
  try {
    let companyData = await Company.find({});
    let candidateData = await candidate.find({}).populate('personal_details');
    
    let companyCount = companyData.length;
    let candidateCount = candidateData.length;
    
    let verifiedCompany = companyData.filter((temp) => temp.status === "approve").length;
    
    let verifiedCandidate = candidateData.filter(
      (item) => item.personal_details?.Aadhar_verified_status === true &&
                item.personal_details?.Pan_verified_status === true
    ).length;
  

      const jobCount=await companyjob.countDocuments({});
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
          Accepted,
          Rejected,
          Processing,
          TotalOfferReleased,
          Job,
          SupportData,
          adminTeam
      });


  } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
  }
};

exports.GetAllSubscriptionplane = async (req, res) => {
  const { calendar } = req.params;
  try {
    let data = [];
    let candidateData = [];

    if (calendar === 'All' || calendar === null) {
      data = await companyTransaction.find({});
      candidateData = await CandidateTransaction.find({});
    } else if (calendar === 'Today') {
      const todayStart = moment().startOf('day').toDate();
      const todayEnd = moment().endOf('day').toDate();

      data = await companyTransaction.find({ purchesed_data: { $gte: todayStart, $lt: todayEnd } });
      candidateData = await CandidateTransaction.find({ purchesed_data: { $gte: todayStart, $lt: todayEnd } });
    } else if (calendar === 'Thisweek') {
      const weekStart = moment().startOf('isoWeek').toDate();
      const weekEnd = moment().endOf('isoWeek').toDate();

      data = await companyTransaction.find({ purchesed_data: { $gte: weekStart, $lt: weekEnd } });
      candidateData = await CandidateTransaction.find({ purchesed_data: { $gte: weekStart, $lt: weekEnd } });
    } else if (calendar === 'Thismonth') {
      const monthStart = moment().startOf('month').toDate();
      const monthEnd = moment().endOf('month').toDate();

      data = await companyTransaction.find({ purchesed_data: { $gte: monthStart, $lt: monthEnd } });
      candidateData = await CandidateTransaction.find({ purchesed_data: { $gte: monthStart, $lt: monthEnd } });
    } else if (calendar === 'Thisyear') {
      const yearStart = moment().startOf('year').toDate();
      const yearEnd = moment().endOf('year').toDate();

      data = await companyTransaction.find({ purchesed_data: { $gte: yearStart, $lt: yearEnd } });
      candidateData = await CandidateTransaction.find({ purchesed_data: { $gte: yearStart, $lt: yearEnd } });
    } else {
      return res.status(400).json({ error: 'Invalid calendar filter' });
    }

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
      TotalEarning
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
