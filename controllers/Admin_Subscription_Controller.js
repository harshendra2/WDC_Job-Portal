const Joi=require("joi");
const subscription=require("../models/SubscriptionSchema");

const EditSubscriptionPlane = Joi.object({
    plane_name: Joi.string().required(),
    price: Joi.number().required()
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