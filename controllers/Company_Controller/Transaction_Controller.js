const CompanySubscription=require('../../models/Company_SubscriptionSchema');

exports.GetAllTransaction=async(req,res)=>{
    try{
        const data = await CompanySubscription.aggregate([
            {
                $lookup: {
                    from: 'companies',
                    localField: 'company_id',
                    foreignField: '_id',
                    as: 'company_details'
                }
            },
            {
                $unwind: '$company_details'
            },
            {
                $project: {
                    _id: 1,
                    company_id: 1,
                    subscription_plan: {
                        plan_name: "$plan_name",
                        price: "$price",
                        search_limit: "$search_limit",
                        available_candidate: "$available_candidate",
                        user_access: "$user_access",
                        cv_view_limit: "$cv_view_limit",
                        download_email_limit: "$download_email_limit",
                        download_cv_limit: "$download_cv_limit",
                        job_posting: "$job_posting",
                        createdDate: "$createdDate",
                        expiresAt: "$expiresAt"
                    },
                    company_details: 1 
                }
            }
        ]);

        const topUpPlans = await CompanySubscription.aggregate([
            {
                $match: {
                    topUp: { $exists: true, $not: { $size: 0 } } 
                }
            },
            {
                $lookup: {
                    from: 'companies',
                    localField: 'company_id',
                    foreignField: '_id',
                    as: 'company_details'
                }
            },
            {
                $unwind: '$company_details'
            },
            {
                $unwind: '$topUp' 
            },
            {
                $project: {
                    _id: 1,
                    company_id: 1,
                    topUpPlans: {
                        plan_name: "$topUp.plane_name",
                        price: "$topUp.plane_price",
                        order_Id: "$topUp.order_Id",
                        date: "$topUp.Date",
                        ExpireDate:"$topUp.ExpireDate"
                    },
                    company_details: 1
                }
            }
        ]);

        const combinedResults = [...data, ...topUpPlans];
        if (combinedResults.length > 0) {
            return res.status(200).send(combinedResults);
        } else {
            return res.status(400).json({ error: "Empty database" });
        }


    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}