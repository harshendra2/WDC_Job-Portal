const mongoose=require('mongoose');
const CompanyTransaction=require('../../models/CompanyTransactionSchema');

exports.GetAllTransaction=async(req,res)=>{
    const {compId}=req.params;
    try{
        if(!compId){
            return res.status(400).json({error:"Please provide company Id"});
        }
        const objectId = new mongoose.Types.ObjectId(compId);
        const data = await CompanyTransaction.aggregate([
            {$match:{company_id:objectId}},
           
        ]).sort({Expire_date:-1})
        if (data.length > 0) {
            return res.status(200).send(data);
        } else {
            return res.status(400).json({ error: "Empty database" });
        }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}