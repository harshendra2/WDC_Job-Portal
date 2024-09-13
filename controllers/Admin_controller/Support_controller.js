const mongoose=require("mongoose");
const IssueSchema=require("../../models/Issue_Schema");
const messageModel=require("../../models/messageModel");

exports.getAllIssuesClaim=async(req,res)=>{
    try{
        const data=await IssueSchema.aggregate([
            {$lookup: {
                from: 'companies',
                localField: 'company_id',
                foreignField: '_id',
                as: 'details'
                }
              },
        ]);

        const temp = await IssueSchema.aggregate([
            {
                $lookup: {
                    from: 'candidates', 
                    localField: 'candidate_id',
                    foreignField: '_id',
                    as: 'details'
                }
            },
            {
                $unwind: {
                    path: '$details',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'candidate_basic_details', 
                    localField: 'details.basic_details',
                    foreignField: '_id',
                    as: 'details' 
                }
            }
        ]);
        
    let arr=[...temp,...data];

        if(temp){
            return res.status(200).send(arr)
        }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

//Action Status

exports.RejectionStatus=async(req,res)=>{
    const {id}=req.params
    try{
        if (!id) {
            return res.status(400).json({ error: "Company ID is required" });
          }
      
          const data = await IssueSchema.findByIdAndUpdate(id, { status: "reject" }, { new: true });
      
          if (data) {
            return res.status(200).json({ message: "Status updated successfully", company: data });
          } else {
            return res.status(404).json({ error: "Issue not found" });
          }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.ResolvedStatus=async(req,res)=>{
    const {id}=req.params;
    try{
        if (!id) {
            return res.status(400).json({ error: "Company ID is required" });
          }
      
          const data = await IssueSchema.findByIdAndUpdate(id, { status: "solved",solved_date:Date.now()}, { new: true });
      
          if (data) {
            return res.status(200).json({ message: "Status updated successfully", company: data });
          } else {
            return res.status(404).json({ error: "Issue not found" });
          }
    }catch(error){
        return res.status(500).json({error:"Internals server error"});
    }
}