const mongoose=require("mongoose");
const CompanyJob=require('../../models/JobSchema');
const candidate=require('../../models/Onboard_Candidate_Schema')

exports.getAllAppliedCandidate=async(req,res)=>{
    const {id}=req.params;
    try{

        const objectId = new mongoose.Types.ObjectId(id); 
        const data = await CompanyJob.aggregate([
            { $match: { company_id: objectId } },
            {
              $lookup: {
                from: 'candidates',
                localField: 'candidate_id',
                foreignField: '_id',
                as: 'candidateDetails'
              }
            },
            { $unwind: '$candidateDetails' },
            {
              $lookup: {
                from: 'candidate_basic_details',
                localField: 'candidateDetails.basic_details',
                foreignField: '_id',
                as: 'basicDetails'
              }
            },
            { $unwind: '$basicDetails' },
            {
              $lookup: {
                from: 'candidate_personal_details',
                localField: 'candidateDetails.personal_details',
                foreignField: '_id',
                as: 'personalDetails'
              }
            },
            { $unwind: '$personalDetails' },
            {
                $lookup: {
                  from: 'candidate_work_details',
                  localField: 'candidateDetails.work_details',
                  foreignField: '_id',
                  as: 'workDetails'
                }
              },
              { $unwind: '$workDetails' },
              {
                $lookup: {
                  from: 'candidate_education_details',
                  localField: 'candidateDetails.education_details',
                  foreignField: '_id',
                  as: 'educationDetails'
                }
              },
              { $unwind: '$educationDetails' }
          ]);
          if(data){
            return res.status(200).send(data);
          }else{
            return res.status(400).json({error:"empty data base"});
          }

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.getCandidateDetails=async(req,res)=>{
    const {id,userId}=req.params;
    try{
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid candidate ID' });
          }
    
          const objectId = new mongoose.Types.ObjectId(userId); 
          const data=await candidate.aggregate([
            { $match: { _id:objectId} },
            {$lookup: {
                from: 'candidate_basic_details',
                localField: 'basic_details',
                foreignField: '_id',
                as: 'basicDetails'
              }
            },
            {
                $lookup: {
                  from: 'candidate_personal_details',
                  localField: 'personal_details',
                  foreignField: '_id',
                  as: 'personalDetails'
                }
              },
              {
                  $lookup: {
                    from: 'candidate_work_details',
                    localField: 'work_details',
                    foreignField: '_id',
                    as: 'workDetails'
                  }
                },
                // {
                //   $lookup: {
                //     from: 'candidate_education_details',
                //     localField: 'candidateDetails.education_details',
                //     foreignField: '_id',
                //     as: 'educationDetails'
                //   }
                // },

          ])
          if(data){
            return res.status(200).send(data);
          }else{
            return res.status(400).json({error:"Empty data base"})
          }

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}