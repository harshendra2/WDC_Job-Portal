const companyJob=require('../../models/JobSchema');

exports.CredibilityEstablishment = async (req, res) => {
    try {
      const data = await companyJob.aggregate([
        {
          $lookup: {
            from: 'companies',       
            localField: 'company_id',   
            foreignField: '_id',      
            as: 'companyDetails'   
          }
        },
        {
          $unwind: '$Shortlisted'     
        },
        {$match:{'Shortlisted.shorted_status':true}},
        {
            $lookup: {
              from: 'candidates',            
              localField: 'Shortlisted.candidate_id',     
              foreignField: '_id',         
              as: 'candidate'    
            }
          },
          {
            $lookup: {
              from: 'candidate_basic_details',       
              localField: 'candidate.basic_details',
              foreignField: '_id',        
              as: 'basicDetails'        
            }
          },
        {
          $project: {
            company_id: 1, 
            basicDetails:{
                name:1
            },              
            companyDetails: {      
              _id: 1,
              company_name: 1                  
            },
            'Shortlisted.candidate_id': 1,
            'Shortlisted.short_Candidate.offer_accepted_status': 1,
            'Shortlisted.short_Candidate.offer_date': 1,
            'Shortlisted.short_Candidate.hired_date': 1
          }
        }
      ]);
      let Accepted=0;
      let  Rejected=0;
      let Processing=0;
      data.map((count)=>{
        if(count?.Shortlisted?.short_Candidate?.offer_accepted_status=="Processing"){
          Processing+=1;
        }else if(count?.Shortlisted?.short_Candidate?.offer_accepted_status=="Accepted"){
          Accepted+=1;
        }else{
          Rejected+=1;
        }

      })

      return res.status(200).json({data,Accepted,Rejected,Processing});   
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  