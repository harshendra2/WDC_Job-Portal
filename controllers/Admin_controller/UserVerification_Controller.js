const company=require('../../models/Onboard_Company_Schema');
const candidate=require('../../models/Onboard_Company_Schema');

exports.GetAllOnboardCompany = async (req, res) => {
  try {
      const companies = await company.find({ status: 'Processing' }).sort({ createdAt: -1 });

      if (companies.length > 0) {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const isGoogleDriveLink = (url) => {
              return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
          };

          const updatedCompanies = companies.map((company) => ({
              ...company._doc,
              profileUrl: company.profile
                  ? (isGoogleDriveLink(company.profile) ? company.profile : `${baseUrl}/${company.profile.replace(/\\/g, '/')}`)
                  : null,
              PANImageUrl: company.PAN_image
                  ? (isGoogleDriveLink(company.PAN_image) ? company.PAN_image : `${baseUrl}/${company.PAN_image.replace(/\\/g, '/')}`)
                  : null,
              GSTImageUrl: company.GST_image
                  ? (isGoogleDriveLink(company.GST_image) ? company.GST_image : `${baseUrl}/${company.GST_image.replace(/\\/g, '/')}`)
                  : null,
          }));

          return res.status(200).json(updatedCompanies);
      } else {
          return res.status(404).json({ error: "No companies found with 'Processing' status" });
      }

  } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.OnboardCompanyRejectAction=async(req,res)=>{
    const {id}=req.params;
    const {message}=req.body;
    try{
            if (!id) {
              return res.status(400).json({ error: "Company ID is required" });
            }
        
            const data = await company.findByIdAndUpdate(id, { status: "reject",message:message,PAN_verify:false,GST_verify:false}, { new: true });
        
            if (data) {
              return res.status(200).json({ message: "Status updated successfully", company: data });
            } else {
              return res.status(404).json({ error: "Company not found" });
            }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}


exports.OnboardCompanyApproveAction=async(req,res)=>{
    const {id}=req.params;
    try{
        if (!id) {
            return res.status(400).json({ error: "Company ID is required" });
          }
      
          const data = await company.findByIdAndUpdate(id, { status: "approve",PAN_verify:false,GST_verify:false}, { new: true });
      
          if (data) {
            return res.status(200).json({ message: "Status updated successfully", company: data });
          } else {
            return res.status(404).json({ error: "Company not found" });
          }
    }catch(error){
     return res.status(500).json({error:"Internal server error"});
    }
}

//Onboard Candidate
exports.GetAllOnboardCandidate=async(req,res)=>{
    try{
        const data = await candidate.aggregate([
          {$match:{status:"Processing"}},
            {
              $lookup: {
                from: 'candidate_basic_details',
                localField: 'basic_details',
                foreignField: '_id',
                as: 'basic_details'
              }
            },
            {
              $lookup: {
                from: 'candidate_personal_details',
                localField: 'personal_details',
                foreignField: '_id',
                as: 'personal_details'
              }
            },
            {
              $lookup: {
                from: 'candidate_work_details',
                localField: 'work_details',
                foreignField: '_id',
                as: 'work_details'
              }
            },
            {
              $lookup: {
                from: 'candidate_education_details',
                localField: 'education_details',
                foreignField: '_id',
                as: 'education_details'
              }
            }
          ]);
          if(data){
          return res.status(200).send(data);
          }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}


exports.OnboardCandidateRejectAction=async(req,res)=>{
    const {id}=req.params;
    const {message}=req.body;
    try{
        if (!id) {
            return res.status(400).json({ error: "Candidate ID is required" });
          }
      
          const data = await candidate.findByIdAndUpdate(id, { status: "reject",message:message}, { new: true });
      
          if (data) {
            return res.status(200).json({ message: "Status updated successfully", company: data });
          } else {
            return res.status(404).json({ error: "Candidate not found" });
          }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.OnboardCandidateApproveAction=async(req,res)=>{
    const {id}=req.params;
    try{
        if (!id) {
            return res.status(400).json({ error: "Candidate ID is required" });
          }
      
          const data = await candidate.findByIdAndUpdate(id, { status: "approve" }, { new: true });
      
          if (data) {
            return res.status(200).json({ message: "Status updated successfully", company: data });
          } else {
            return res.status(404).json({ error: "Candidate not found" });
          }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

//Verified Company

exports.GetAllVerifiedOnboardCompany=async(req,res)=>{
  try{

    const companies = await company.find({ status: 'approve' }).sort({ createdAt: -1 });

    if (companies.length > 0) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const isGoogleDriveLink = (url) => {
            return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
        };

        const updatedCompanies = companies.map((company) => ({
            ...company._doc,
            profileUrl: company.profile
                ? (isGoogleDriveLink(company.profile) ? company.profile : `${baseUrl}/${company.profile.replace(/\\/g, '/')}`)
                : null,
            PANImageUrl: company.PAN_image
                ? (isGoogleDriveLink(company.PAN_image) ? company.PAN_image : `${baseUrl}/${company.PAN_image.replace(/\\/g, '/')}`)
                : null,
            GSTImageUrl: company.GST_image
                ? (isGoogleDriveLink(company.GST_image) ? company.GST_image : `${baseUrl}/${company.GST_image.replace(/\\/g, '/')}`)
                : null,
        }));

        return res.status(200).json(updatedCompanies);
    } else {
        return res.status(404).json({ error: "No companies found"});
    }

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

//Verified Candidate

exports.GetAllVerifiedOnboardCandidate=async(req,res)=>{
  try{

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}