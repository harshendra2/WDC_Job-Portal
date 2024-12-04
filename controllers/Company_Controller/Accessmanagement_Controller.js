const bcrypt=require('bcryptjs');
const company=require('../../models/Onboard_Company_Schema');
const candidate_basic=require('../../models/TempsData')
const ExcelJS = require('exceljs');

exports.GetAllSubAdmin=async(req,res)=>{
    const {cmpId}=req.params
    try{
      const AcceessData=await company.findOne({_id:cmpId}).select('HRs')
      return res.status(200).send(AcceessData);
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

exports.EditHrResponsibility=async(req,res)=>{
    const {cmpId,email}=req.params;
    const {dashboard,hire_candidate,create_job,creadibility,subscription,transaction,support,access_management}=req.body;
    try{
        const Company = await company.findById(cmpId);
        if (!Company) {
            return res.status(404).json({ error: "Company not found" });
        }

        const HrIndex = Company.HRs.findIndex(hr => hr.email === email);
        if (HrIndex === -1) {
            return res.status(404).json({ error: "HR with the specified email not found" });
        }

        Company.HRs[HrIndex] = {
            ...Company.HRs[HrIndex], 
            dashboard,
            hire_candidate,
            create_job,
            creadibility,
            subscription,
            transaction,
            support,
            access_management
        };

        const success = await Company.save();
        if (success) {
            return res.status(200).json({ message: "HR responsibilities updated successfully" });
        } else {
            return res.status(400).json({ error: "Something went wrong" });
        }
    }catch(error){
    return res.status(500).json({error:"Inaternal server error"});
    }
}
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

exports.GetALLtempsdat = async (req, res) => {
    try {
        // Fetch data using aggregation
        const data = await candidate_basic.aggregate([
            {
                $lookup: {
                    from: 'candidates_edu_skills',
                    localField: 'edu_skills',
                    foreignField: '_id',
                    as: 'Education_details',
                },
            },
        ]);

        // Create a new Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Candidates Data');

        // Define columns for the Excel file
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Mobile', key: 'mobile', width: 15 },
            { header: 'City', key: 'city', width: 15 },
            { header: 'State', key: 'state', width: 20 },
            { header: 'Subscription', key: 'subscription', width: 15 },
            { header: 'Education', key: 'education', width: 30 },
            { header: 'Skills', key: 'skills', width: 40 },
            { header: 'Experience', key: 'experience', width: 15 },
        ];

        // Process and add rows to the worksheet
        data.forEach((candidate) => {
            const educationDetails = candidate.Education_details[0] || {};
            worksheet.addRow({
                id: candidate.id,
                name: candidate.name,
                email: candidate.email,
                mobile: candidate.mobile,
                city: candidate.city,
                state: candidate.state,
                subscription: candidate.subscription,
                education: educationDetails.education || 'N/A',
                skills: educationDetails.skills_list ? educationDetails.skills_list.join(', ') : 'N/A',
                experience: educationDetails.experience || 'N/A',
            });
        });

        // Set the response headers for file download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=candidates_data.xlsx'
        );

        // Write the Excel file to the response
        await workbook.xlsx.write(res);
        res.end(); // End the response
    } catch (error) {
        console.error('Error generating Excel:', error);
        return res.status(500).send({ message: 'Internal server error' });
    }
};