const mongoose = require('mongoose');
const CompanySubscription=require("../../models/Company_SubscriptionSchema");
const subscription=require("../../models/SubscriptionSchema");
const CompanyJob=require("../../models/JobSchema");


exports.getsubscriptionStatus=async(req,res)=>{
    const {id}=req.params;
    try{
        const objectId = new mongoose.Types.ObjectId(id); 
        data = await CompanySubscription.aggregate([
            { $match: { company_id:objectId} },
            {
              $lookup: {
                from: 'subscriptionplanes',
                localField: 'subscription_id',
                foreignField: '_id',
                as: 'AdminSubscription'
              }
            }
          ]);
          if(data){
            return res.status(200).send(data);
          }

    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});
    }
}

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