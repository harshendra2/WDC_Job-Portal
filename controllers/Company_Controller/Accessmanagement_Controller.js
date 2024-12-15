const bcrypt=require('bcryptjs');
const company=require('../../models/Onboard_Company_Schema');

exports.GetAllSubAdmin=async(req,res)=>{
    const {cmpId,email}=req.params
    try{
      const AcceessData=await company.findOne({_id:cmpId}).select('HRs')
      let data =AcceessData?.HRs.filter(temp=>temp.email!==email);
      return res.status(200).send(data);
     // return res.status(200).send(AcceessData);
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.GetSingleHrAccessDetails=async(req,res)=>{
    const {cmpId,email}=req.params;
    try{
        const existedData=await company.findById(cmpId);
        const data=existedData.HRs.find(hr=>hr.email==email);
       if(data){
        return res.status(200).json(data);
       }

    }catch(error){
        return res.status(500).json({error:"Inaternal server error"});
    }
}

exports.AddNewHrData=async(req,res)=>{
    const {cmpId}=req.params;
    const {dashboard,hire_candidate,create_job,creadibility,subscription,transaction,support,access_management,email,password}=req.body;
    try{
        const ExistedData=await company.findOne({'HRs.email':email});
        if(ExistedData){
            return res.status(400).json({error:"This Email already existed in our data base"});
        }
        const Company=await company.findById(cmpId);
        const hashedPassword = await bcrypt.hash(password, 12);
        let data={
            dashboard,hire_candidate,create_job,creadibility,subscription,transaction,support,access_management,email,password:hashedPassword
        }
        Company.HRs.push(data);
       let success= await Company.save();
        if(success){
            return res.status(200).json({message:"New HR added successfully"});
        }else{
            return res.status(400).json({error:"Some thing went wrong"});
        }
    }catch(error){
        return res.status(500).json({error:"Inaternal server error"});
    }
}

exports.EditHrResponsibility = async (req, res) => {
    const { cmpId, email } = req.params;
    const {
      dashboard,
      hire_candidate,
      create_job,
      creadibility,
      subscription,
      transaction,
      support,
      access_management,
    } = req.body;
  
    try {
      // Find the company by ID
      const Company = await company.findById(cmpId);
      if (!Company) {
        return res.status(404).json({ error: "Company not found" });
      }

      if (Company) {
        Company.HRs.forEach((hr) => {
          if (hr.email ==email) {
            hr.dashboard=dashboard,
           hr.hire_candidate=hire_candidate,
           hr.create_job=create_job,
           hr.creadibility=creadibility,
            hr.subscription=subscription,
            hr.transaction=transaction,
            hr.support=support,
            hr.access_management=access_management
          }
        });
        await Company.save();
      }
  
  
      return res.status(200).json({ message: "HR responsibilities updated successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  

exports.DeleteExistedHRData = async (req, res) => {
    const { cmpId, email } = req.params;

    try {
        const ExistedCmp = await company.findById(cmpId);
        if (!ExistedCmp) {
            return res.status(404).json({ error: "This company does not exist in our database" });
        }

        const HrIndex = ExistedCmp.HRs.findIndex(hr => hr.email === email);
        if (HrIndex === -1) {
            return res.status(404).json({ error: "HR with the specified email not found" });
        }

        ExistedCmp.HRs.splice(HrIndex,1);
        const success = await ExistedCmp.save();
        if (success) {
            return res.status(200).json({ message: "The HR data has been deleted successfully" });
        } else {
            return res.status(400).json({ error: "Something went wrong while saving" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
