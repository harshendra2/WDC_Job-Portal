const mongoose = require('mongoose');
const moment=require('moment')
const crypto=require('crypto');
const CompanySubscription=require("../../models/Company_SubscriptionSchema");
const subscription=require("../../models/SubscriptionSchema");
const CompanyJob=require("../../models/JobSchema");
const CompanyTransaction=require('../../models/CompanyTransactionSchema');
const Company=require('../../models/Onboard_Company_Schema')

function generateOrderId() {
    return crypto.randomBytes(6).toString('hex');
}


exports.getCompanyDetails = async (req, res) => {
  const { id } = req.params;
  try {
    if(!id){
      return res.status(400).json({error:"Please provide company Id"});
    }
    const objectId = new mongoose.Types.ObjectId(id);
    const companies = await Company.findById(objectId); 
      await companies.removeExpiredBatches();
    const [subscriptionData, jobData] = await Promise.all([
      CompanySubscription.aggregate([
        { $match: { company_id: objectId, expiresAt: { $gte: new Date() },createdDate:{$lte:new Date()}} },
        {
          $lookup: {
            from: "subscriptionplanes",
            localField: "subscription_id",
            foreignField: "_id",
            as: "AdminSubscription",
          },
        },
      ]),
      CompanyJob.find({ company_id: objectId }),
    ]);
    if (subscriptionData && subscriptionData.length > 0) {
      const formattedSubscriptionData = subscriptionData.map((subscription) => {
        if (subscription.createdDate) {
          subscription.createdDate = moment(subscription.createdDate).format(
            "MMMM Do YYYY, h:mm:ss a"
          );
        }
        if (subscription.expiresAt) {
          subscription.expiresAt = moment(subscription.expiresAt).format(
            "MMMM Do YYYY, h:mm:ss a"
          );
        }
        // if (
        //   Array.isArray(subscription.topUp) &&
        //   subscription.topUp.length > 0
        // ) {
        //   subscription.topUp = subscription.topUp.map((topUp) => {
        //     if (topUp.Date) {
        //       topUp.Date = moment(topUp.Date).format("MMMM Do YYYY, h:mm:ss a");
        //     }
        //     if (topUp.ExpireDate) {
        //       topUp.ExpireDate = moment(topUp.ExpireDate).format(
        //         "MMMM Do YYYY, h:mm:ss a"
        //       );
        //     }
        //     return topUp;
        //   });
        // }

        return subscription;
      });
      let ApplicationCount = 0;
      let HiredCount = 0;
      for (const temp of jobData) {
        ApplicationCount += temp?.applied_candidates?.length || 0;
        for(const count of temp?.Shortlisted){
        HiredCount += count?.short_Candidate?.offer_accepted_status=='Accepted';
        }
      }

      return res.status(200).json({
        subscriptionData: formattedSubscriptionData,
        jobCreatedCount: jobData.length,
        applicationRecieved: ApplicationCount,
        HiredCount,
      });
    } else {
      return res.status(404).json({ error: "No subscription data found" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.AllSubscriptionCount=async(req,res)=>{
  const {cmpId,start,end}=req.params;
  try{
    let data;
    let count;
    let cv_view_count;
  
      let temp =await CompanyStatusCount(start,end,cmpId);
      data=temp?.data;
      count=temp?.count
      cv_view_count=temp?.cvCount

      return res.status(200).send({data,count,cv_view_count})

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

async function CompanyStatusCount(start, end, CmpID) {
  const ObjectId = new mongoose.Types.ObjectId(CmpID);

  const datas = await CompanyJob.aggregate([
    { 
      $match: {
        company_id: ObjectId,
        createdDate: { $gte: new Date(start), $lte:new Date(end) }
      } 
    },
    {
      $project: {
        jobCreated: { $cond: [{ $ifNull: ["$job_title", false] }, 1, 0] },
        promotedJob: { $cond: [{ $eq: ["$promote_job", true] }, 1, 0] },
        unpromotedJob: { $cond: [{ $eq: ["$promote_job", false] }, 1, 0] },
      }
    },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: { $ifNull: ["$jobCreated", 0] } },
        totalPromotedJobs: { $sum: { $ifNull: ["$promotedJob", 0] } },
        totalUnpromotedJobs: { $sum: { $ifNull: ["$unpromotedJob", 0] } }
      }
    },
    {
      $project: {
        totalJobs: { $ifNull: ["$totalJobs", 0] },
        totalPromotedJobs: { $ifNull: ["$totalPromotedJobs", 0] },
        totalUnpromotedJobs: { $ifNull: ["$totalUnpromotedJobs", 0] }
      }
    }
  ]);
  const count = await CompanyJob.aggregate([
    {$match:{company_id:ObjectId}},
    {
      $project: {
        appliedCount: {
          $size: {
            $filter: {
              input: "$applied_candidates",
              as: "candidate",
              cond: {
                $and: [
                  { $gte: ["$$candidate.applied_date",new Date(start)] },
                  { $lte: ["$$candidate.applied_date",new Date(end)] }
                ]
              }
            }
          }
        },
        shortlistCount: {
          $size: {
            $filter: {
              input: "$Shortlisted",
              as: "shortlisted",
              cond: {
                $and: [
                  { $gte: ["$$shortlisted.sortlisted_date",new Date(start)] },
                  { $lte: ["$$shortlisted.sortlisted_date",new Date(end)] }
                ]
              }
            }
          }
        },
        offerLetterCount: {
          $size: {
            $filter: {
              input: "$Shortlisted",
              as: "shortlisted",
              cond: {
                $and: [
                  { $ne: ["$$shortlisted.short_Candidate.offer_letter", null] },
                  { $gte: ["$$shortlisted.short_Candidate.offer_date",new Date(start)] },
                  { $lte: ["$$shortlisted.short_Candidate.offer_date",new Date(end)] }
                ]
              }
            }
          }
        },
        HiredCount: {
          $size: {
            $filter: {
              input: "$Shortlisted",
              as: "shortlisted",
              cond: {
                $and: [
                  { $ne: ["$$shortlisted.short_Candidate.hired_date", null] },
                  { $gte: ["$$shortlisted.short_Candidate.hired_date",new Date(start)] },
                  { $lte: ["$$shortlisted.short_Candidate.hired_date",new Date(end)] }
                ]
              }
            }
          }
        },
      }
    },
    // Step 3: Group and accumulate counts
    {
      $group: {
        _id: null,
        
        totalHiredCandidates: { $sum: "$HiredCount" },
        totalAppliedCandidates: { $sum: "$appliedCount" },
        totalShortlistedCandidates: { $sum: "$shortlistCount" },
        totalOfferLetters: { $sum: "$offerLetterCount" }
      }
    }
  ]);
  
  
  const result = await Company.aggregate([
    {$match:{_id:ObjectId}},
    {
        $project: {
            view_CV: {
                $filter: {
                    input: "$view_CV",
                    as: "view",
                    cond: {
                        $and: [
                            { $gte: ["$$view.Date",new Date(start)] },
                            { $lte: ["$$view.Date",new Date(end)] }
                        ]
                    }
                }
            },
            resume_download_count: {
                $filter: {
                    input: "$resume_download_count",
                    as: "download",
                    cond: {
                        $and: [
                            { $gte: ["$$download.Date",new Date(start)] },
                            { $lte: ["$$download.Date",new Date(end)] }
                        ]
                    }
                }
            },
            Email_download_count: {
              $filter: {
                  input: "$Email_download_count",
                  as: "download",
                  cond: {
                      $and: [
                          { $gte: ["$$download.Date",new Date(start)] },
                          { $lte: ["$$download.Date",new Date(end)] }
                      ]
                  }
              }
          }
        }
    },
    {
        $group: {
            _id: null,
            totalViewCV: { $sum: { $sum: "$view_CV.View" } },
            totalDownloadCount: { $sum: { $sum: "$resume_download_count.download_count" } },
            totalEmailDownloadCount: { $sum: { $sum: "$Email_download_count.download_count" } }
        }
    }
]);
  
  let data= datas.length ? datas[0] : { totalJobs: 0, totalPromotedJobs: 0, totalUnpromotedJobs: 0 };
  let cvCount=result[0] || { totalViewCV: 0, totalDownloadCount: 0 ,totalEmailDownloadCount:0}
  return {data,count,cvCount};
}



//Upgrade plane
exports.GetUpgradeSubscriptionPlane = async (req, res) => {
  const { companyId } = req.params;

  try {
      const objectId = new mongoose.Types.ObjectId(companyId);
      const existedSubscriptions = await CompanySubscription.aggregate([
          { $match: { company_id: objectId, expiresAt: { $gte: new Date() } } }
      ]);
      if (existedSubscriptions.length === 0) {
          return res.status(404).json({ message: 'No active subscription found for the company.' });
      }

      const existedSubscription = existedSubscriptions[0];
      const adminSubscriptions = await subscription.find({});

      const planHierarchy = {
          'Basic': 1,
          'Premium': 2,
          'Enterprise': 3
      };

      const currentPlanRank = planHierarchy[existedSubscription.plane_name];

      let availableUpgradePlans = [];
      adminSubscriptions.forEach((plan) => {
          const planRank = planHierarchy[plan.plane_name];
          if (planRank > currentPlanRank) {
              availableUpgradePlans.push(plan);
          }
      });
      return res.status(200).json({ availableUpgradePlans });
      
  } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.CreateOrder = async (req, res) => {
  //const apiUrl ='https://api.cashfree.com/pg/orders';
  const apiUrl = 'https://sandbox.cashfree.com/pg/orders';
    const { company_id, sub_id} = req.body;

    try {
      const CompanyDate=await Company.findOne({_id:company_id});
        const subscriptions = await subscription.findOne({ _id: sub_id });
        if (!subscriptions) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        const orderId = generateOrderId();

        const requestData = {
            customer_details: {
                customer_id: orderId,
                customer_email:CompanyDate.email,
                customer_phone: String(CompanyDate.mobile),
            },
            order_meta: {

                return_url: `https://didatabank.com/PaymentSuccessfull?order_id=order_${orderId}`
            },
            order_id: `order_${orderId}`,
            order_amount:subscriptions.price,
            order_currency: "INR",
            order_note: 'Upgrade Subscription',
            subscriptionid:sub_id
        };
        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-version': '2022-01-01',
                'x-client-id': process.env.CASHFREE_CLIENT_ID,
                'x-client-secret': process.env.CASHFREE_CLIENT_SECRET
            },
            body: JSON.stringify(requestData)
        };

        const response = await fetch(apiUrl, requestOptions);
        const responseData = await response.json();
          if (response.ok) {
            const orderData = {
                order_id: responseData.order_id,
                payment_methods:responseData.order_meta?.payment_methods || 'Not Provided',
                order_status: responseData.order_status,
                order_token: responseData.order_token,
                refundsurl: responseData.refunds ? responseData.refunds.url : 'N/A',
                company_id: company_id,
                subscription_id: sub_id,
                amount:subscriptions.price,
                paymentLink:responseData?.payment_link,
                customer_email:CompanyDate.email,
                customer_phone:CompanyDate.mobile,
            };
            console.log(orderData)
            res.status(200).json(orderData);
        } else {
            console.error('Error:', responseData);
            res.status(500).json({ error: "Internal server error" });
        }
    } catch (error) {
        console.error('Request Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.SubscriptionPlaneVerifyPayment = async (req, res) => {
  const { orderId, sub_id, companyId, paymentMethod } = req.body;
   const apiUrl = `https://sandbox.cashfree.com/pg/orders/${orderId}`
  //const apiUrl = `https://api.cashfree.com/pg/orders/${orderId}`;
  const headers = {
    'x-client-id': process.env.CASHFREE_CLIENT_ID,
    'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
    'x-api-version': '2021-05-21',
  };
  try {

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: headers,
    });

    const result = await response.json();

      if (result.order_status === 'PAID') {
        console.log("PAid Successfully");
          const subData = await subscription.findById(sub_id);
          if (!subData) {
              return res.status(404).json({ error: "Subscription plan not found" });
          }

          const previousPlan = await CompanySubscription.findOne({ company_id: companyId,expiresAt: { $gte: new Date()},createdDate:{$lte:new Date()}})

              const newExpirationDate = previousPlan
              ? new Date(previousPlan.expiresAt)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          if (previousPlan) {
              previousPlan.expiresAt = new Date(); 
              await previousPlan.save();
          }

          const newSubscription = new CompanySubscription({
              company_id: companyId,
              subscription_id: sub_id,
              plane_name: subData.plane_name,
              transaction_Id: orderId,
              price: subData.price,
              search_limit: subData.search_limit,
              available_candidate: subData.available_candidate,
              user_access: subData.user_access,
              cv_view_limit: subData.cv_view_limit,
              download_email_limit: subData.download_email_limit,
              download_cv_limit: subData.download_cv_limit,
              job_posting: subData.job_posting,
              createdDate: new Date(),
              expiresAt: newExpirationDate
          });
          
          await newSubscription.save();
          const transaction=new CompanyTransaction({
            company_id:companyId,
            type:'Upgrade plane',
            Plane_name: subData.plane_name,
            price:subData.price,
            payment_method:paymentMethod,
            transaction_Id:orderId,
            purchesed_data:new Date(),
            Expire_date:newExpirationDate
        })
        await transaction.save();

          return res.status(201).json({
              message: "Payment verified and subscription upgraded successfully",
              paymentData: response.data,
              subscriptionData: newSubscription
          });
      } else {
          return res.status(400).json({ error: "Payment not verified or payment failed" });
      }
  } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
  }
};

