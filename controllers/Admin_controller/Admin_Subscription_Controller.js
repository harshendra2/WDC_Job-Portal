const Joi=require("joi");
const subscription=require("../../models/SubscriptionSchema");
const TopUpPlane=require('../../models/ToupPlane');
const CandidateSub=require('../../models/Candidate_SubscriptionSchema');
const GreenBatch=require('../../models/Green_Tick_Schema');
const PromotePlan=require('../../models/Promote_Job_Schema');
const mongoose=require('mongoose');

const EditSubscriptionPlane = Joi.object({
    plane_name: Joi.string().required(),
    price: Joi.number().required()
  });



  exports.getallsubscription = async (req, res) => {
    try {
        const topUpPlane = await TopUpPlane.find({});
        const subscriptionplane = await subscription.find({});
        const promoteJob = await PromotePlan.find({});
        const Greenbatch = await GreenBatch.find({})
            return res
                .status(200)
                .send({
                    subscriptionplane,
                    topUpPlane,
                    promoteJob,
                    Greenbatch
                });
        
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAllSubscriptionName = async (req, res) => {
    try {
        const subscriptionData = await subscription.aggregate([
            {
                $project: {
                    _id: 1,
                    plane_name: 1
                }
            }
        ]);

        if (subscriptionData.length > 0) {
            return res.status(200).json(subscriptionData);
        } else {
            return res.status(404).json({ error: "No subscription data found" });
        }

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};



exports.getSingleSubscription=async(req,res)=>{
    const {id}=req.params;
    try{
        const data=await subscription.findById({_id:id});
        if(data){
         return res.status(200).send(data)
        }else{
            return res.status(404).json({message:"Empty data base"});
        }

    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});
    }
}

exports.editSubscriptionPlane=async(req,res)=>{
    const {plane_name,price,search_limit,available_candidate,user_access,cv_view_limit,download_email_limit,download_cv_limit,job_posting}=req.body;
    const {id}=req.params;

    const { error } = EditSubscriptionPlane.validate({plane_name,price});
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

    try{
        const subscriptiondata={plane_name,price,search_limit,available_candidate,user_access,cv_view_limit,download_email_limit,download_cv_limit,job_posting}
       
        const data=await subscription.findByIdAndUpdate(id,subscriptiondata,{new:true});
        if(data){
            return res.status(200).json({message:"Subscription updated Successfully",subscription:data})
        }else{
            return res.status(404).json({error:"Subscription Plane is not updated"});
        }


    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});
    }
}

exports.createSubscriptionPlane=async(req,res)=>{
    const {plane_name,price,search_limit,available_candidate,user_access,cv_view_limit,download_email_limit,download_cv_limit,job_posting}=req.body;

    const { error } = EditSubscriptionPlane.validate({plane_name,price});
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try{

        const ExistedName=await subscription.findOne({plane_name});
       if(ExistedName){
        return res.status(400).json({error:"This Subscription Plane already Existed"})
       }else{
        const subscriptiondata=new subscription({
            plane_name,price,search_limit,available_candidate,user_access,cv_view_limit,download_email_limit,download_cv_limit,job_posting
        })
       const data=await subscriptiondata.save();
       if(data){
        return res.status(200).json({message:"New Subscription created Successfully",data});
       }
    }

    }catch(error){
        return res.status(500).json({error:"Internal Server error"});
    }
}

//TopUp Plane Code
exports.CreateNewTopUpPlane=async(req,res)=>{
    const {plane_name,price,search_limit,cv_view_limit,job_posting,user_access}=req.body;
    try{
        const topupdata={plane_name,price,search_limit,cv_view_limit,job_posting,user_access}
      
        data = await new TopUpPlane(topupdata).save();

      if (data) {
        return res.status(201).json({
          message: "TopUp plan created successfully",
          topupdata: data
        });
    }

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.EditTopUpPlane=async(req,res)=>{
    const{plane_name,price,search_limit,cv_view_limit,job_posting,user_access}=req.body;
    const {id}=req.params;
    try{
     const topupdata={plane_name,price,search_limit,cv_view_limit,job_posting,user_access}

        const data=await TopUpPlane.findByIdAndUpdate(id,topupdata,{new:true});
        if(data){
            return res.status(200).json({message:"TopUp plan updated Successfully",subscription:data})
        }else{
            return res.status(404).json({error:"Topup Plan is not updated"});
        }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.GetAllTopUpplaneName=async(req,res)=>{
    try{
        const topupName= await TopUpPlane.aggregate([
            {
                $project: {
                    _id: 1,
                    plane_name: 1,
                    Subscription_Name:1
                }
            }
        ]);

        if (topupName.length > 0) {
            return res.status(200).json(topupName);
        } else {
            return res.status(404).json({ error: "No subscription data found" });
        }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}


exports.getSingleTopUpPlane=async(req,res)=>{
    const{id}=req.params;
    try{
      const data=await TopUpPlane.findById({_id:id});
      if(data){
        return res.status(200).send(data);
      }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}


//Candidate Subscription plane
exports.GetAllCandidateSubscriptionPlane=async(req,res)=>{
    try{
        const data=await CandidateSub.find({});
        if(data){
            return res.status(200).send(data);
        }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.CreateCandidateSubscription=async(req,res)=>{
    const {plane_name,price,top_candidate,job_recommandation,resume_write,interview_question,customer_support}=req.body;
    try{
        const exists=await CandidateSub.findOne({plane_name});
        if(exists){
         return res.status(400).json({error:"This Subscription plane already exists"});
        }else{
       const Data=new CandidateSub({plane_name,price,top_candidate,job_recommandation,resume_write,interview_question,customer_support});
       const savedData=await Data.save();
       if(savedData){
         return res.status(200).json({message:"New Subscription plane Created Successfully"});
       }
        }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.GetCandidateSubscriptionName=async(req,res)=>{
    try{
        const data=await CandidateSub.aggregate([{
            $project:{
                _id:1,
                plane_name:1
            }
        }])
        if(data){
            return res.status(200).send(data);
        }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.GetSingleCandidateSubscription=async(req,res)=>{
    const {id}=req.params;
    try{
     const data=await CandidateSub.findById({_id:id});
     if(data){
        return res.status(200).send(data);
     }

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.EditCandidateSubscription=async(req,res)=>{
    const {plane_name,price,top_candidate,job_recommandation,resume_write,interview_question,customer_support}=req.body;
    const {id}=req.params;

    const { error } = EditSubscriptionPlane.validate({plane_name,price});
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

    try{
        const subscriptiondata={plane_name,price,top_candidate,job_recommandation,resume_write,interview_question,customer_support}
       
        const data=await CandidateSub.findByIdAndUpdate(id,subscriptiondata,{new:true});
        if(data){
            return res.status(200).json({message:"Subscription updated Successfully",subscription:data})
        }else{
            return res.status(404).json({error:"Subscription Plane is not updated"});
        }
    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});
    }
}

exports.GetAllGreenBatchSubscription=async(req,res)=>{
    try{
        const data=await GreenBatch.find({});
        if(data){
         return res.status(200).send(data);
        }else{
            return res.status(200).send([]);
        }

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.GetSingleGreenBatch=async(req,res)=>{
    const {id}=req.params;
    try{
        if(!id){
            return res.status(400).json({error:"Please provide Id"});
        }
        const ObjectID=new mongoose.Types.ObjectId(id)
        const data=await GreenBatch.findById(ObjectID);
        return res.status(200).send(data);

    }catch(error){
        return res.status(500).json({error:'Internal server error'});
    }
}

exports.EditGreenBatch=async(req,res)=>{
    const {id}=req.params;
    const {batch_name,price,month}=req.body;
    try{
        const updateData = {
            batch_name:batch_name,
            price:price,
            month:month
        };
        const updatedBatch= await GreenBatch.findByIdAndUpdate(
           id,
            { $set: updateData },
            { new: true }
        );

        return res.status(200).json({
            message: "Plan updated successfully",
            updatedBatch
        });
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.AddNewGreenBatch=async(req,res)=>{
    const {batch_name,price,month}=req.body;
    try{
        const newBatch = new GreenBatch({ batch_name, price, month });
        await newBatch.save();
        return res.status(200).json({ message: "Subscription plan created successfully" });
    }catch(error){
     return res.status(500).json({error:"Internal server error"});
    }
}

exports.GetAllPromoteSubscription=async(req,res)=>{
    try{

        const data=await PromotePlan.find({});
        return res.status(200).send(data);

    }catch(error){
        return res.status(500).json({error:"Internal server errror"});
    }
}

exports.GetSinglePromoteSubscription=async(req,res)=>{
    const {id}=req.params;
    try{
        if(!id){
            return res.status(400).json({error:"Please provide ID"});
        }
        const ID=new mongoose.Types.ObjectId(id);
        const data=await PromotePlan.findById(ID);
        return res.status(200).send(data);

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.EditPromoteSub=async(req,res)=>{
    const {id}=req.params;
    const {plane_name,price}=req.body;
    try{
        if(!id){
            return res.status(400).json({error:"Please provide ID"});
        }
        const updateData = {
            price:price,
            plane_name:plane_name
        };
        const updatedBatch= await PromotePlan.findByIdAndUpdate(
           id,
            { $set: updateData },
            { new: true }
        );

        return res.status(200).json({
            message: "Plan updated successfully",
            updatedBatch
        });
        
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.AddNewPromotePlan=async(req,res)=>{
    const {plane_name,price}=req.body;
    try{
        const newBatch = new PromotePlan({ plane_name, price});
        await newBatch.save();
        return res.status(200).json({ message: "Subscription plan created successfully" });
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}