const mongoose = require('mongoose');
const CompanySubscription=require("../../models/Company_SubscriptionSchema")


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