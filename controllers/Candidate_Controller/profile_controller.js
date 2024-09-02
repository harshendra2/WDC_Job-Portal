

exports.getProfilePercentageStatus=async(req,res)=>{
    const {id}=req.params;
    const {designation,employee_type,companyName,location,location_type,reporting_structure,current_workingStatus,notice_period,negotiation_day,start_date,end_date}=req.body;
    try{

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.EditExperiencData=async(req,res)=>{
    const {candidate_id,expr_id}=req.params;
    const {designation,employee_type,companyName,location,location_type,reporting_structure,current_workingStatus,notice_period,negotiation_day,start_date,end_data}=req.body;
    try{

    }catch(error){
        return res.status(500).json({error:"Internal"})
    }
}