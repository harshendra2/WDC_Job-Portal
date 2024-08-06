const Joi=require("joi");
const subscription=require("../models/SubscriptionSchema");

const EditSubscriptionPlane = Joi.object({
    plane_name: Joi.string().required(),
    price: Joi.number().required(),
    search_limit: Joi.number().required(),
    available_candidate: Joi.boolean().required(),
    user_access: Joi.number().required(),
    cv_view_limit: Joi.number().required(),
    download_email_limit: Joi.boolean().required(),
    download_cv_limit: Joi.boolean().required(),
    job_posting: Joi.number().required()
  });


exports.getallsubscription=async(req,res)=>{
    try{
        const data=await subscription.find({});
        if(data){
            return res.status(200).send(data);
        }else{
            return res.status(404).json({message:"Empty data base"});
        }

    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});
    }
}

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
    const {id}=req.body;

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