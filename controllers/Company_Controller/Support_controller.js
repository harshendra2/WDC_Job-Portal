const IssueSchema=require("../../models/Issue_Schema");

exports.AddNewIssue=async(req,res)=>{
    const {id}=req.params;
    const {Issue_type,description}=req.body;
    try{

    }catch(error){
        return res.status(500).json({error:"Internal Server Error"});
    }
}