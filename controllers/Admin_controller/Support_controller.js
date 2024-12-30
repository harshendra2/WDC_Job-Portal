const mongoose=require("mongoose");
const IssueSchema=require("../../models/Issue_Schema");
const messageModel=require("../../models/messageModel");

exports.getAllIssuesClaim=async(req,res)=>{
    const {page,limit}=req.params;
    try{
 const skip=parseInt(page-1)*parseInt(limit);
    const companyTransactionCount = await IssueSchema.countDocuments();
    const totalPage = Math.ceil(companyTransactionCount / parseInt(limit));
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const data = await IssueSchema.aggregate([
            {$skip:skip},
            {$limit:parseInt(limit)},
            {
                $lookup: {
                    from: 'companies',
                    localField: 'company_id',
                    foreignField: '_id',
                    as: 'companyDetails'
                }
            },
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'candidate_id',
                    foreignField: '_id',
                    as: 'candidateDetails'
                }
            },
            {
                $unwind: {
                    path: '$candidateDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'candidate_basic_details',
                    localField: 'candidateDetails.basic_details',
                    foreignField: '_id',
                    as: 'candidateBasicDetails'
                }
            },
            {
                $lookup: {
                    from: 'messages',
                    localField: '_id',
                    foreignField: 'Issue_id', // Assuming 'Issue_id' links issues and messages
                    as: 'messageDetails'
                }
            },
            {
                $addFields: {
                    adminViewedCount: {
                        $size: {
                            $filter: {
                                input: '$messageDetails',
                                as: 'message',
                                cond: { $eq: ['$$message.Admin_view', false] }
                            }
                        }
                    },
                    details: {
                        companyEmail: {
                            $arrayElemAt: [
                                {
                                    $map: {
                                        input: { $arrayElemAt: ['$companyDetails.HRs', 0] }, // Get the first HR array from the company
                                        as: 'hr',
                                        in: '$$hr.email' // Extract email of each HR
                                    }
                                },
                                0 // Extract the first HR's email
                            ]
                        },
                        candidateEmail: { $arrayElemAt: ['$candidateBasicDetails.email', 0] }, // Extract candidate email
                        candidateBasicDetails: { $arrayElemAt: ['$candidateBasicDetails', 0] } // Other candidate basic details
                    }
                }
            },
            {$sort:{createdDate:-1}},
            {
                $project: {
                    companyDetails: 0, // Exclude original fields if not needed
                    candidateDetails: 0,
                    candidateBasicDetails: 0,
                    'details.candidateBasicDetails': 0,
                    messageDetails: 0 // Optional: Exclude messageDetails if not required in the output
                }
            }
        ]);
        
        
        if (data && data.length > 0) {
            const isGoogleDriveLink = (url) => {
                return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
            };
    
            const updatedData = data.map((item) => {
                return {
                    ...item,  
                    IssueUrl: item?.file
                        ? (isGoogleDriveLink(item.file) ? item.file : `${baseUrl}/${item.file.replace(/\\/g, '/')}`)
                        : null
                };
            });
        
            return res.status(200).send({data:updatedData,totalPage,page});
        } else {
            return res.status(404).json({ message: 'No data found' });
        }
        

    //     const temp = await IssueSchema.aggregate([
    //         {
    //             $lookup: {
    //                 from: 'candidates', 
    //                 localField: 'candidate_id',
    //                 foreignField: '_id',
    //                 as: 'details'
    //             }
    //         },
    //         {
    //             $unwind: {
    //                 path: '$details',
    //                 preserveNullAndEmptyArrays: true
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from: 'candidate_basic_details', 
    //                 localField: 'details.basic_details',
    //                 foreignField: '_id',
    //                 as: 'details' 
    //             }
    //         }
    //     ]);
        
    // let arr=[...temp,...data];

        // if(temp){
        //     return res.status(200).send(data)
        // }
    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

// exports.getAllIssuesClaim = async (req, res) => {
//     try {
//         const data = await IssueSchema.aggregate([
//             // Lookup company details
//             {
//                 $lookup: {
//                     from: 'companies',
//                     localField: 'company_id',
//                     foreignField: '_id',
//                     as: 'company_details'
//                 }
//             },
//             // Lookup candidate details
//             {
//                 $lookup: {
//                     from: 'candidates',
//                     localField: 'candidate_id',
//                     foreignField: '_id',
//                     as: 'candidate_details'
//                 }
//             },
//             {
//                 $unwind: {
//                     path: '$candidate_details',
//                     preserveNullAndEmptyArrays: true
//                 }
//             },
//             // Lookup candidate basic details from 'candidate_basic_details' collection
//             {
//                 $lookup: {
//                     from: 'candidate_basic_details',
//                     localField: 'candidate_details.basic_details',
//                     foreignField: '_id',
//                     as: 'candidate_basic_details'
//                 }
//             }
//         ]);

//         if (data) {
//             return res.status(200).send(data);
//         } else {
//             return res.status(404).json({ message: "No issues found" });
//         }
//     } catch (error) {
//         return res.status(500).json({ error: "Internal server error" });
//     }
// };

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