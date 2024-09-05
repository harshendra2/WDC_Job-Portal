const mongoose = require('mongoose');
const moment=require('moment')
const CompanySubscription=require("../../models/Company_SubscriptionSchema");
const subscription=require("../../models/SubscriptionSchema");
const CompanyJob=require("../../models/JobSchema");


exports.getsubscriptionStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const objectId = new mongoose.Types.ObjectId(id);
    let data = await CompanySubscription.aggregate([
      { $match: { company_id: objectId } },
      {
        $lookup: {
          from: 'subscriptionplanes',
          localField: 'subscription_id',
          foreignField: '_id',
          as: 'AdminSubscription'
        }
      }
    ]);

    // Check if data exists
    if (data && data.length > 0) {
      // Iterate through each subscription data object
      data = data.map(subscription => {
        // Format the createdDate and expiresAt fields
        subscription.createdDate = moment(subscription.createdDate).format('MMMM Do YYYY, h:mm:ss a');
        subscription.expiresAt = moment(subscription.expiresAt).format('MMMM Do YYYY, h:mm:ss a');
        
        // If there are topUp items, format their dates as well
        if (subscription.topUp && subscription.topUp.length > 0) {
          subscription.topUp = subscription.topUp.map(topUp => {
            topUp.Date = moment(topUp.Date).format('MMMM Do YYYY, h:mm:ss a');
            topUp.ExpireDate = moment(topUp.ExpireDate).format('MMMM Do YYYY, h:mm:ss a');
            return topUp;
          });
        }

        return subscription;
      });

      return res.status(200).send(data);
    } else {
      return res.status(404).json({ error: "No subscription data found" });
    }
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.GetJobCreatedCount=async(req,res)=>{
  const {id}=req.params;
  try{
    const objectId = new mongoose.Types.ObjectId(id); 
    const data=await CompanyJob.find({company_id: objectId });

    return res.status(200).json({jobcreated:data.length});

  }catch(error){
    return res.status(500).json({error:"Internal Server Error"});
  }
}

exports.UpgradeSubscriptionPlane=async(req,res)=>{
  const { orderId, subscriptionId, companyId } = req.body;
  try{

  }catch(error){
    return res.status(500).json({error:"Internal Server Error"});
  }
}