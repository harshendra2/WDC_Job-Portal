const moment=require('moment');
const Company=require('../../models/Onboard_Company_Schema');
const candidate=require('../../models/Onboard_Candidate_Schema');
const companyjob=require('../../models/JobSchema');
const CompanySubscriptionPlane=require('../../models/Company_SubscriptionSchema');
const companyTransaction=require('../../models/CompanyTransactionSchema');
const CandidateTransaction=require('../../models/CandidateTransactionSchema');

exports.getCountofCandidate = async (req, res) => {
  try {
      const companyCount = await Company.countDocuments({});
      const candidateCount = await candidate.countDocuments({});
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

      return res.status(200).send({
          companyCount,
          candidateCount,
          Accepted,
          Rejected,
          Processing,
          TotalOfferReleased
      });

  } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
  }
};


exports.GetAllSubscriptionplane = async (req, res) => {
  const { calendar } = req.params;
  try {
    let data;
    let candidateData;
    if (calendar == 'All'||calendar==null) {
      data = await companyTransaction.find({});
      candidateData=await CandidateTransaction.find({});
    } else if (calendar === 'Today') {
      const todayStart = moment().startOf('day').toDate();
      const todayEnd = moment().endOf('day').toDate();

      data = await companyTransaction.find({
        purchesed_data: {
          $gte: todayStart,
          $lt: todayEnd,
        },
      });
      candidateData=await CandidateTransaction.find({
        purchesed_data: {
          $gte: todayStart,
          $lt: todayEnd,
        },
      })

    } else if (calendar === 'This week') {
      const weekStart = moment().startOf('isoWeek').toDate();
      const weekEnd = moment().endOf('isoWeek').toDate();

      data = await companyTransaction.find({
        purchesed_data: {
          $gte: weekStart,
          $lt: weekEnd,
        },
      });

      candidateData=await CandidateTransaction.find({
        purchesed_data: {
          $gte: weekStart,
          $lt: weekEnd,
        },
      })
    } else if (calendar === 'This month') {
      const monthStart = moment().startOf('month').toDate();
      const monthEnd = moment().endOf('month').toDate();

      data = await companyTransaction.find({
        purchesed_data: {
          $gte: monthStart,
          $lt: monthEnd,
        },
      });

      candidateData=await CandidateTransaction.find({
        purchesed_data: {
          $gte: monthStart,
          $lt: monthEnd,
        },
      })
    } else if (calendar === 'This year') {
      const yearStart = moment().startOf('year').toDate();
      const yearEnd = moment().endOf('year').toDate();

      data = await companyTransaction.find({
        purchesed_data: {
          $gte: yearStart,
          $lt: yearEnd,
        },
      });
      candidateData=await CandidateTransaction.find({
        purchesed_data: {
          $gte: yearStart,
          $lt: yearEnd,
        },
      })
    } else {
      return res.status(400).json({ error: 'Invalid calendar filter' });
    }

    const subscriptionCount = {};
    const TopUpCount = {};
    const PromotJob = {
      price: 0,
      count: 0,
    };
    let companyEarning=0;
    data.map((item) => {
      if (item?.type === 'Promote job') {
        PromotJob.count += 1;
        PromotJob.price += item?.price || 0;
        companyEarning+=item?.price || 0;
      }

      if (item?.type === 'TopUp plane') {
        const planName = item?.Plane_name;

        if (!TopUpCount[planName]) {
          TopUpCount[planName] = {
            count: 0,
            totalPrice: 0,
          };
        }

        TopUpCount[planName].count += 1;
        TopUpCount[planName].totalPrice += item?.price || 0;
        companyEarning+=item?.price || 0;
      }

      if (item?.type === 'Subscription') {
        const planName = item?.Plane_name;

        if (!subscriptionCount[planName]) {
          subscriptionCount[planName] = {
            count: 0,
            totalPrice: 0,
          };
        }

        subscriptionCount[planName].count += 1;
        subscriptionCount[planName].totalPrice += item?.price || 0;
        companyEarning+=item?.price || 0;
      }
    });
    let CandidateSubscriptionCount = {};
    let CandidateEarning=0;
    candidateData.map((item)=>{
      if (item?.type === 'Subscription') {
        const planName = item?.Plane_name;

        if (!CandidateSubscriptionCount[planName]) {
          CandidateSubscriptionCount[planName] = {
            count: 0,
            totalPrice: 0,
          };
        }

        CandidateSubscriptionCount[planName].count += 1;
        CandidateSubscriptionCount[planName].totalPrice += item?.price || 0;
        CandidateEarning+=item?.price || 0;
      }
    })
     let TotalEarning=companyEarning+CandidateEarning

    return res.status(200).send({ subscriptionCount, TopUpCount, PromotJob,companyEarning,CandidateSubscriptionCount,TotalEarning});
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};