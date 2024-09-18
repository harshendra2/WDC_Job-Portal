const mongoose = require('mongoose');
const moment=require('moment')
const { Cashfree } = require('cashfree-pg');
const CompanySubscription=require("../../models/Company_SubscriptionSchema");
const subscription=require("../../models/SubscriptionSchema");
const CompanyJob=require("../../models/JobSchema");

// Configure Cashfree
Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
Cashfree.XEnviornment = Cashfree.Environment.SANDBOX;

function generateOrderId() {
    return crypto.randomBytes(6).toString('hex');
}


exports.getCompanyDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const objectId = new mongoose.Types.ObjectId(id);

    const [subscriptionData, jobData] = await Promise.all([
      CompanySubscription.aggregate([
        { $match: { company_id: objectId, expiresAt: { $gte: new Date() } } },
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
        if (
          Array.isArray(subscription.topUp) &&
          subscription.topUp.length > 0
        ) {
          subscription.topUp = subscription.topUp.map((topUp) => {
            if (topUp.Date) {
              topUp.Date = moment(topUp.Date).format("MMMM Do YYYY, h:mm:ss a");
            }
            if (topUp.ExpireDate) {
              topUp.ExpireDate = moment(topUp.ExpireDate).format(
                "MMMM Do YYYY, h:mm:ss a"
              );
            }
            return topUp;
          });
        }

        return subscription;
      });
      let ApplicationCount = 0;
      let HiredCount = 0;
      for (const temp of jobData) {
        ApplicationCount += temp?.applied_candidates?.length || 0;
        HiredCount += temp?.hired_candidate?.length || 0;
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


exports.OfferVerifier = async (req, res) => {
  const { companyId,PAN} = req.params;
  try {
    const objectId = new mongoose.Types.ObjectId(companyId);

    const data = await CompanyJob.aggregate([
      { $match: { company_id: objectId } },
      { $unwind: '$Job_offer' },
      {
        $lookup: {
          from: 'candidates',
          localField: 'Job_offer.candidate_id',
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
      {
        $match: {
          'personalDetails.PAN': PAN 
        }
      },
      {
        $group: {
          _id: '$candidateDetails._id',
          candidateDetails: { $first: '$candidateDetails' },
          personalDetails: { $first: '$personalDetails' },
          basicDetails: { $first: '$basicDetails' }
        }
      }
    ]);

    if (data.length > 0) {
      const name = data[0]?.basicDetails?.name || "Unknown";
      return res.status(200).json({ message: `The PAN user ${name} currently has a job offer in hand`, data });
    } else {
      return res.status(200).json({ message: "No job offer found for this candidate." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


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

      // Define the hierarchy of subscription plans with their ranks
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



exports.UpgradeSubscriptionplane=async(req,res)=>{
  const { company_id, sub_id, price, mobile, name, email } = req.body;

    if (!price || !mobile || !name || !email) {
        return res.status(400).json({ error: "All fields are required: price, mobile, name, email" });
    }
    try{

        const subscriptions = await subscription.findOne({ _id:sub_id});
        
        if (!subscriptions) {
            return res.status(404).json({ error: "Subscription plane not found" });
        }
        const orderId = generateOrderId();

        const request = {
            "order_amount": price,
            "order_currency": "INR",
            "order_id": orderId,
            "customer_details": {
                "customer_id": company_id, 
                "customer_phone": mobile,
                "customer_name": name,
                "customer_email": email,
            }
        };
         const response = await Cashfree.PGCreateOrder(request);
    res.status(200).json(response);
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.SubscriptionPlaneVerifyPayment = async (req, res) => {
  const { orderId, sub_id, companyId, paymentMethod } = req.body;

  try {
      const response = await Cashfree.PGOrderFetchPayment(orderId);

      if (response && response.data && response.data.order_status === 'PAID') {
          const subData = await subscription.findById(sub_id);
          if (!subData) {
              return res.status(404).json({ error: "Subscription plan not found" });
          }

          const previousPlan = await CompanySubscription.findOne({ company_id: companyId })
              .sort({ createdDate: -1 });

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
              expiresAt: newExpirationDate,
              paymentMethod: paymentMethod
          });
          
          await newSubscription.save();

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
