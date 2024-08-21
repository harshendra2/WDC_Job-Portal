const mongoose=require("mongoose");
const company=require("../../models/Onboard_Company_Schema");

exports.GetCompanyProfile=async(req,res)=>{
    const {id}=req.params;
    try{
        const objectId = new mongoose.Types.ObjectId(id); 
        const data=await company.findById({_id:objectId});
        if(data){
            return res.status(200).send(data)
        }else{
            return res.status(400).json({error:"Empty data base"});
        }

    }catch(error){
        console.log(error);
     return res.status(500).json({error:"Internal server error"});
    }
}