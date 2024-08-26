const company=require('../../models/Onboard_Company_Schema');

exports.CompanyProfileStatus=async(req,res)=>{
    const {id}=req.params;
    try{
        const data=await company.findById(id);
        

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}