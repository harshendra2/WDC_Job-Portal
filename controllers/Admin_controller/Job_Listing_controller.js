const CompanyJob=require("../../models/JobSchema");

exports.GetAllJobsListing=async(req,res)=>{
    try{
        const temp = await CompanyJob.aggregate([
            {
                $group: {
                    _id: '$company_id',
                    jobCount: { $sum: 1 } // Count the number of jobs per company
                }
            }
        ]);
        
        const companyIds = temp.map(item => item._id);
        
        const data = await CompanyJob.aggregate([
            {
                $match: { company_id: { $in: companyIds } }
            },
            {
                $lookup: {
                    from: 'companies',
                    localField: 'company_id',
                    foreignField: '_id',
                    as: 'details'
                }
            },
            {
                $unwind: '$details'
            },
            {
                $project: {
                    'details': 1, // Include the 'details' field
                    'jobCount': {
                        $let: {
                            vars: {
                                companyJobCount: {
                                    $arrayElemAt: [
                                        temp.map(t => ({ _id: t._id, jobCount: t.jobCount })),
                                        { $indexOfArray: [companyIds, '$company_id'] }
                                    ]
                                }
                            },
                            in: '$$companyJobCount.jobCount'
                        }
                    }
                }
            }
        ]);
        
        if (data) {
            return res.status(200).send(data);
        }
        
    }catch(error){
        console.log(error);
        return res.status(500).json({error:"Internal server error"});
    }
}