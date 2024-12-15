const crypto=require("crypto");
const mongoose=require("mongoose");
const subscription=require("../../models/SubscriptionSchema");
const CompanySubscription=require("../../models/Company_SubscriptionSchema");
const TopUpPlane=require("../../models/ToupPlane");
const CompanyTransaction=require("../../models/CompanyTransactionSchema");
const company=require('../../models/Onboard_Company_Schema');
const { resolveSoa } = require("dns");

function generateOrderId() {
    return crypto.randomBytes(6).toString('hex');
}

exports.GetCurrentSubscriptionPlane=async(req,res)=>{
    const {companyId}=req.params;
    try{
        const Id=new mongoose.Types.ObjectId(companyId);
        const CurrentSubscription=await CompanySubscription.aggregate([{
            $match: {
              expiresAt: { $gte: new Date() },
              createdDate:{$lte:new Date()},
              company_id: Id
            }
          }])
     if(CurrentSubscription){
        return res.status(200).send(CurrentSubscription);
     }else{
        return res.status(200).send([]);
     }

    }catch(error){
        return res.status(500).json({error:"Intrnal server errror"});
    }
}

exports.getAllSubscriptionPlane=async(req,res)=>{
    const {companyId}=req.params;
    try{
        const company_id=new mongoose.Types.ObjectId(companyId);
        const previousPlan=await CompanyTransaction.findOne({company_id,type:"Subscription",Plane_name:"Basic"})

            // const CurrentSubscription = await CompanySubscription.aggregate([
            //     {
            //         $match: {
            //             company_id: company_id,
            //             expiresAt: { $gte: new Date() },
            //             createdDate: { $lte: new Date() }
            //         }
            //     },
               
            //     {
            //         $group: {
            //             _id: "$company_id",
            //             subscription_ids: { $push: "$subscription_id" },
            //             plane_name: { $last: "$plane_name" },
                      
                       
            
            //             earliest_created_date: { $min: "$createdDate" },
            //             latest_expires_at: { $max: "$expiresAt" }
            //         }
            //     },
             
            //     {
            //         $project: {
            //             _id: 0,
            //             //company_id: "$_id",
            //             subscription_ids: 1,
            //             plane_name: 1,
            //            // total_price: 1,
            //             //search_limit: 1,
            //            // user_access: 1,
            //             //cv_view_limit: 1,
            //             //download_email_limit: "$combined_download_email_limit",
            //             //download_cv_limit: "$combined_download_cv_limit",
            //             //job_posting: "$combined_job_posting",
            //             createdDate: "$earliest_created_date",
            //             expiresAt: "$latest_expires_at"
            //         }
            //     }
            // ]);

            const CurrentSubscription=await CompanySubscription.aggregate([{
                        $match: {
                            company_id: company_id,
                            expiresAt: { $gte: new Date() },
                            createdDate: { $lte: new Date() }
                        }
                    }])

         let getSubscriptionPlans;
    //          if(previousPlan){
    //      getSubscriptionPlans = await subscription.aggregate([
    //         { $match: {plane_name: { $ne: previousPlan.Plane_name } } }
    //     ]);
    // }else{
    getSubscriptionPlans = await subscription.find({})
    //}
        
            return res.status(200).send({getSubscriptionPlans,CurrentSubscription});


    }catch(error){
        console.log(error)
        return res.status(500).json({error:"Internal Server error"});
    }
}

exports.getAllPaymentMethod=async(req,res)=>{
    try{
        const paymentMethods = [
            {
              "name": "upi",
              "display_name": "UPI",
              "active": true
            },
            {
              "name": "credit_card",
              "display_name": "Credit Card",
              "active": true
            },
            {
              "name": "net_banking",
              "display_name": "Net Banking",
              "active": true
            }
          ];
        if (paymentMethods) {
            return res.status(200).json({ paymentMethods: paymentMethods});
        } else {
            return res.status(500).json({ error: "Unable to fetch payment methods" });
        }
    }catch(error){
        console.log(error);
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.payment = async (req, res) => {
    const apiUrl = 'https://sandbox.cashfree.com/pg/orders';
    const {id,sub_id}=req.body;
    try {
         if(!id&&!sub_id){
            return res.status(400).json({error:"Please provide ID"})
         }
         const previousPlan = await CompanyTransaction.findOne({
            company_id: id,
            Plane_name: { $regex: /^Basic\s*$/, $options: 'i' }, // Case-insensitive match for "Basic"
        });
        
        const previousPlane = await subscription.findOne({ _id: sub_id });
        
        if (previousPlane?.plane_name === previousPlan?.Plane_name) {
            return res.status(400).json({ error: "Basic Plan can be purchased only once." });
        }
        

        const subscriptions=await subscription.findOne({_id:sub_id});
        const CompanyDate=await company.findOne({_id:id});
        const orderId = generateOrderId();
        const requestData = {
            customer_details: {
                customer_id: orderId,
                customer_email:CompanyDate.email,
                customer_phone: String(CompanyDate.mobile),
            },
            order_meta: {
                // return_url: "https://didatabank.com/PaymentSuccessfull?order_id=order_"+orderId\
                return_url:"http://65.20.91.47/main/subscription-plan/subscription"
            },
            order_id:"order_"+orderId,
            order_amount:subscriptions?.price,
            order_currency: "INR",
            order_note: 'Subscription',
            subscriptionid:sub_id
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-version': '2022-01-01',
                'x-client-id': process.env.CASHFREE_CLIENT_ID,
                'x-client-secret': process.env.CASHFREE_CLIENT_SECRET
            },
            body: JSON.stringify(requestData)
        };

        const response = await fetch(apiUrl, requestOptions);
        const responseData = await response.json();
          if (response.ok) {
            const orderData = {
                order_id: responseData.order_id,
                payment_methods:responseData.order_meta?.payment_methods || 'Not Provided',
                order_status: responseData.order_status,
                order_token: responseData.order_token,
                refundsurl: responseData.refunds ? responseData.refunds.url : 'N/A',
                company_id:id,
                subscription_id: sub_id,
                paymentLink:responseData?.payment_link,
                amount:subscriptions?.price,
                customer_email:CompanyDate.email,
                customer_phone:CompanyDate.mobile,
            };
            res.status(200).json(orderData);
        } else {
            console.error('Error:', responseData);
            res.status(500).json({ error: "Internal server error" });
        }

    } catch (error) {
        res.status(500).json({ error: "Error creating order" });
    }
};

exports.verifyPayment = async (req, res) => {
    const { orderId, subscriptionId, companyId,paymentMethod} = req.body;
    //const apiUrl = `https://api.cashfree.com/pg/orders/${orderId}`;
    const apiUrl = `https://sandbox.cashfree.com/pg/orders/${orderId}`
    const headers = {
      'x-client-id': process.env.CASHFREE_CLIENT_ID,
      'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
      'x-api-version': '2021-05-21',
    };
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: headers,
          });
      
          const result = await response.json();
      
            if (result.order_status === 'PAID') {
            const data = await subscription.findById(subscriptionId);
            
            if (data) {
                const subdata = new CompanySubscription({
                    company_id: companyId,
                    subscription_id:subscriptionId,
                    plane_name: data.plane_name,
                    transaction_Id:orderId,
                    price: data.price,
                    search_limit: data.search_limit,
                    user_access: data.user_access,
                    cv_view_limit: data.cv_view_limit,
                    download_email_limit: data.download_email_limit,
                    download_cv_limit: data.download_cv_limit,
                    job_posting: data.job_posting,
                    Credibility_Search:data.Credibility_Search,
                    ai_question:data.ai_question,
                    ai_job_description:data.ai_job_description,
                    candidate_match:data.candidate_match,
                    support:data.support,
                    createdDate: new Date(),
                    expiresAt: new Date(Date.now() + 30*24*60*60*1000), // Set expiration date to 30 days from now
                });
                await subdata.save();
                
            
                const transaction=new CompanyTransaction({
                    company_id:companyId,
                    type:'Subscription',
                    Plane_name:data.plane_name,
                    price:data.price,
                    payment_method:paymentMethod,
                    transaction_Id:orderId,
                    purchesed_data:new Date(),
                    Expire_date: new Date(Date.now() + 30*24*60*60*1000)
                })
                await transaction.save();

                return res.status(201).json({
                    message: "Payment verified and subscription created successfully",
                    paymentData: response.data,
                    subscriptionData: subdata,
                    orderId:orderId
                });
            } else {
                return res.status(404).json({ error: "Subscription plan not found" });
            }
        } else {
            return res.status(400).json({ error: "Payment not verified or payment failed" });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

//extend Subscription Plane


exports.Extendpayment=async(req,res)=>{
    const {price,id,mobile,name,email}=req.body;
    if (!price || !id || !mobile || !name || !email) {
        return res.status(400).json({ error: "All fields are required: price, id, mobile, name, email" });
    }
    try {
        const orderId = generateOrderId();
        const request = {
            "order_amount":price,
            "order_currency": "INR",
            "order_id": orderId,
            "customer_details": {
                "customer_id":id,
                "customer_phone":mobile,
                "customer_name":name,
                "customer_email":email,
            }
        };

        // Create order
        const response = await Cashfree.PGCreateOrder(request);

        // Send response to client
        res.json(response.data);

    } catch (error) {
        res.status(500).json({ error: "Error creating order" });
    }
}

exports.ExtendVerifyPayment=async(req,res)=>{
    const { orderId, subscriptionId, companyId } = req.body;

    try {
        const response = await Cashfree.PGOrderFetchPayment(orderId);

        if (response && response.data && response.data.order_status === 'PAID') {
            const subscriptionData = await subscription.findById(subscriptionId);

            if (subscriptionData) {
                const existingSubscription = await CompanySubscription.findOne({ 
                    company_id: companyId, 
                    subscription_id: subscriptionId 
                });

                if (existingSubscription) {
                    const currentDate = new Date();
                    existingSubscription.expiresAt = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                    existingSubscription.search_limit = subscriptionData.search_limit;
                    existingSubscription.user_access = subscriptionData.user_access;
                    existingSubscription.cv_view_limit = subscriptionData.cv_view_limit;
                    existingSubscription.job_posting = subscriptionData.job_posting;
                    existingSubscription.available_candidate=true;
                    existingSubscription.download_email_limit=true;
                    existingSubscription.download_cv_limit=true;
                    await existingSubscription.save();

                    return res.status(200).json({
                        message: "Subscription extended successfully",
                        paymentData: response.data,
                        subscriptionData: existingSubscription
                    });
                } else {
                    // Create a new subscription if none exists
                    const newSubscription = new CompanySubscription({
                        company_id: companyId,
                        subscription_id: subscriptionId,
                        plane_name: subscriptionData.plane_name,
                        price: subscriptionData.price,
                        search_limit: subscriptionData.search_limit,
                        available_candidate: subscriptionData.available_candidate,
                        user_access: subscriptionData.user_access,
                        cv_view_limit: subscriptionData.cv_view_limit,
                        download_email_limit: subscriptionData.download_email_limit,
                        download_cv_limit: subscriptionData.download_cv_limit,
                        job_posting: subscriptionData.job_posting,
                        createdDate: new Date(),
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Set expiration date to 30 days from now
                    });
                    await newSubscription.save();

                    return res.status(201).json({
                        message: "Payment verified and new subscription created successfully",
                        paymentData: response.data,
                        subscriptionData: newSubscription
                    });
                }
            } else {
                return res.status(404).json({ error: "Subscription plan not found" });
            }
        } else {
            return res.status(400).json({ error: "Payment not verified or payment failed" });
        }

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}


//Renew Subsction plane

exports.GetReNewSubscriptionPlan = async (req, res) => {
    const { company_id } = req.params;

    try {
        const previousPlan=await CompanyTransaction.findOne({company_id,type:"Subscription",Plane_name:"Basic"})
        // const previousPlan = await CompanySubscription.findOne({
        //     company_id,
        //     plane_name: { $regex: /^Basic\s*$/, $options: 'i' } 
        // });
        const objectId=new mongoose.Types.ObjectId(company_id);
       // const previousSubscription=await CompanySubscription.aggregate([{ $match: { company_id: objectId, expiresAt: { $gte: new Date() },createdDate:{$lte:new Date()}} }])
         if(previousPlan){
        const getSubscriptionPlans = await subscription.aggregate([
            { $match: {plane_name: { $ne: previousPlan.Plane_name } } }
            //{ $match: { _id: { $ne: previousPlan.subscription_id } } }
        ]);
        return res.status(200).send({getSubscriptionPlans});
         }else{
            const getSubscriptionPlans = await subscription.find({})
            return res.status(200).send({getSubscriptionPlans});
         } 

    } catch (error) {
       return res.status(500).json({error:"Internal server error"});
    }
}

exports.RenewSubscriptionPlane = async (req, res) => {
    const apiUrl = 'https://sandbox.cashfree.com/pg/orders';
    const { company_id, subscription_id} = req.body;
    try {
        const subscriptions = await subscription.findOne({ _id:subscription_id});
        const CompanyDate=await company.findOne({_id:company_id});
        const orderId = generateOrderId();
        const requestData = {
            customer_details: {
                customer_id: orderId,
                customer_email:CompanyDate.email,
                customer_phone: String(CompanyDate.mobile),
            },
            order_meta: {
                return_url: "http://65.20.91.47/main/subscription-plan/subscription"
            },
            order_id:"order_"+orderId,
            order_amount:subscriptions?.price,
            order_currency: "INR",
            order_note: 'Subscription',
            subscriptionid:subscription_id
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-version': '2022-01-01',
                'x-client-id': process.env.CASHFREE_CLIENT_ID,
                'x-client-secret': process.env.CASHFREE_CLIENT_SECRET
            },
            body: JSON.stringify(requestData)
        };

        const response = await fetch(apiUrl, requestOptions);
        const responseData = await response.json();
          if (response.ok) {
            const orderData = {
                order_id: responseData.order_id,
                payment_methods:responseData.order_meta?.payment_methods || 'Not Provided',
                order_status: responseData.order_status,
                order_token: responseData.order_token,
                refundsurl: responseData.refunds ? responseData.refunds.url : 'N/A',
                company_id:company_id,
                subscription_id: subscription_id,
                paymentLink:responseData?.payment_link,
                amount:subscriptions?.price,
                customer_email:CompanyDate.email,
                customer_phone:CompanyDate.mobile,
            };
            res.status(200).json(orderData);
        } else {
            console.error('Error:', responseData);
            res.status(500).json({ error: "Internal server error" });
        }

    } catch (error) { 
        return res.status(500).json({ error: "Internal server error" });
    }
};


exports.RenewPlaneVerifyPayment = async (req, res) => {
    const { orderId, subscription_id,company_id,paymentMethod} = req.body;
    //const apiUrl = `https://api.cashfree.com/pg/orders/${orderId}`;
    const apiUrl = `https://sandbox.cashfree.com/pg/orders/${orderId}`
    const headers = {
      'x-client-id': process.env.CASHFREE_CLIENT_ID,
      'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
      'x-api-version': '2021-05-21',
    };
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: headers,
          });
      
          const result = await response.json();
      
            if (result.order_status === 'PAID') {
            const subscriptionData = await subscription.findById(subscription_id);

            if (subscriptionData) {
                const existingSubscriptions = await CompanySubscription.find({ 
                    company_id: company_id ,
                    expiresAt: { $gte: new Date() },
                    createdDate:{$lte:new Date()}
                })

                const existingSubscription = existingSubscriptions[0];
                const createdDate = existingSubscription?.expiresAt
    ? new Date(existingSubscription.expiresAt.getTime() + 24 * 60 * 60 * 1000) 
    : new Date();

const expiresAts = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000); 

            
                // Create a new subscription for the company
                const newSubscription = new CompanySubscription({
                    company_id: company_id,
                    subscription_id: subscription_id,
                    plane_name: subscriptionData.plane_name,
                    price: subscriptionData.price,
                    search_limit: subscriptionData.search_limit,
                    available_candidate: subscriptionData.available_candidate,
                    user_access: subscriptionData.user_access,
                    cv_view_limit: subscriptionData.cv_view_limit,
                    download_email_limit: subscriptionData.download_email_limit,
                    download_cv_limit: subscriptionData.download_cv_limit,
                    job_posting: subscriptionData.job_posting,
                    Credibility_Search:subscriptionData.Credibility_Search,
                    ai_question:subscriptionData.ai_question,
                    ai_job_description:subscriptionData.ai_job_description,
                    candidate_match:subscriptionData.candidate_match,
                    support:subscriptionData.support,
                    createdDate:createdDate,
                    expiresAt:expiresAts, 
                });
                await newSubscription.save();

                const transaction=new CompanyTransaction({
                    company_id:company_id,
                    type:'Renew Plane',
                    Plane_name:subscriptionData.plane_name,
                    price:subscriptionData.price,
                    payment_method:paymentMethod,
                    transaction_Id:orderId,
                    purchesed_data:createdDate,
                    Expire_date:expiresAts
                })
                await transaction.save();

                return res.status(201).json({
                    message: "Payment verified and Subscription plan is renewed successfully",
                    orderId:orderId
                });
            } else {
                return res.status(404).json({ error: "Subscription not found" });
            }
        } else {
            return res.status(400).json({ error: "Payment not verified or payment failed" });
        }

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};


//TopUp Plane
exports.GetAllTopupPlane = async (req, res) => {
    const { company_id } = req.params;
    try {
        const currentPlan = await CompanySubscription.find({
            company_id,
            expiresAt: { $gte: new Date() },
            createdDate: { $lte: new Date() }
        })
        .sort({ expiresAt: -1 })
        .limit(1);

        if (!currentPlan || currentPlan.length === 0) {
            return res.status(404).json({ error: "No subscription plan found for the company." });
        }

        const subscriptions = await subscription.findOne({ plane_name: currentPlan[0].plane_name });
        
        if (!subscriptions) {
            return res.status(404).json({ error: "No subscription details found for the current plan." });
        }

        async function getTopUpPlane(fieldName) {
            const fieldValue = subscriptions[fieldName];

            if (typeof fieldValue === 'string' && fieldValue === 'Unlimited') {
                return await TopUpPlane.findOne({
                    [fieldName]: { $exists: true, $ne: 0, $ne: null }
                });
            } else if (typeof fieldValue === 'boolean' && fieldValue === true) {
                return await TopUpPlane.findOne({ [fieldName]: true });
            } else if (typeof fieldValue === 'string') {
                return await TopUpPlane.findOne({
                    [fieldName]: { $exists: true }
                });
            } else if (typeof fieldValue === 'number' && fieldValue !== 0) {
                return await TopUpPlane.findOne({
                    [fieldName]: { $exists: true, $ne: 0 }
                });
            }

            return null;
        }

        let topupArray = [];

        function isDuplicate(data) {
            return topupArray.some(item => item.plane_name === data.plane_name);
        }

        const fieldNames = [
            'search_limit',
            'cv_view_limit',
            'job_posting',
            'available_candidate',
            'user_access',
            'download_email_limit',
            'download_cv_limit',
            'Credibility_Search',
            'ai_question',
            'ai_job_description'
        ];

        for (const fieldName of fieldNames) {
            const data = await getTopUpPlane(fieldName);
            if (data && !isDuplicate(data)) {
                topupArray.push(data);
            }
        }

        return res.status(200).json(topupArray);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



exports.TopUpSubscriptionPlane = async (req, res) => {
    const apiUrl = 'https://sandbox.cashfree.com/pg/orders';
    const { company_id, topup_id } = req.body;
    try {
        if (!company_id && !topup_id) {
            return res.status(400).json({ error: 'Please provide Id' });
        }
        const subscription = await TopUpPlane.findOne({ _id: topup_id });

        if (!subscription) {
            return res.status(404).json({ error: 'TopUp plane not found' });
        }
        const CompanyDate = await company.findOne({ _id: company_id });
        const orderId = generateOrderId();
        const requestData = {
            customer_details: {
                customer_id: orderId,
                customer_email: CompanyDate.email,
                customer_phone: String(CompanyDate.mobile)
            },
            order_meta: {
                // return_url: "https://didatabank.com/PaymentSuccessfull?order_id=order_"+orderId\
                return_url:
                    'http://65.20.91.47/main/subscription-plan/top-ups'
            },
            order_id: 'order_' + orderId,
            order_amount: subscription?.price,
            order_currency: 'INR',
            order_note: 'top Up plane',
            subscriptionid: topup_id
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'x-api-version': '2022-01-01',
                'x-client-id': process.env.CASHFREE_CLIENT_ID,
                'x-client-secret': process.env.CASHFREE_CLIENT_SECRET
            },
            body: JSON.stringify(requestData)
        };

        const response = await fetch(apiUrl, requestOptions);
        const responseData = await response.json();
        if (response.ok) {
            const orderData = {
                order_id: responseData.order_id,
                payment_methods:
                    responseData.order_meta?.payment_methods || 'Not Provided',
                order_status: responseData.order_status,
                order_token: responseData.order_token,
                refundsurl: responseData.refunds
                    ? responseData.refunds.url
                    : 'N/A',
                company_id: company_id,
                topupId: topup_id,
                paymentLink: responseData?.payment_link,
                amount: subscription?.price,
                customer_email: CompanyDate.email,
                customer_phone: CompanyDate.mobile
            };
            res.status(200).json(orderData);
        } else {
            console.error('Error:', responseData);
            res.status(500).json({ error: 'Internal server error' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.TopUpPlaneVerifyPayment = async (req, res) => {
    const { orderId, topupId, companyId, paymentMethod } = req.body;
    //const apiUrl = `https://api.cashfree.com/pg/orders/${orderId}`;
    const apiUrl = `https://sandbox.cashfree.com/pg/orders/${orderId}`;
    const headers = {
        'x-client-id': process.env.CASHFREE_CLIENT_ID,
        'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
        'x-api-version': '2021-05-21'
    };
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: headers
        });

        const result = await response.json();
        if (result.order_status === 'PAID') {
            const TopupData = await TopUpPlane.findById(topupId);

            if (!TopupData) {
                return res.status(404).json({ error: 'Top-up plan not found' });
            }

            const existingSubscription = await CompanySubscription.findOne({
                company_id: companyId,
                expiresAt: { $gte: new Date() },
                createdDate: { $lte: new Date() }
            });

            if (!existingSubscription) {
                return res
                    .status(404)
                    .json({ error: 'No subscription found for the company' });
            }

            existingSubscription.search_limit += TopupData.search_limit || 0;
            existingSubscription.user_access += TopupData.user_access || 0;
            existingSubscription.cv_view_limit += TopupData.cv_view_limit || 0;
            existingSubscription.job_posting += TopupData.job_posting || 0;
            existingSubscription.Credibility_Search+=TopupData.Credibility_Search ||0;
            
            existingSubscription.ai_question += TopupData.ai_question|| 0;
            existingSubscription.ai_job_description+=TopupData.ai_job_description ||0;

          
            if (TopupData.download_email_limit) {
                existingSubscription.download_email_limit = true;
            }
            if (TopupData.download_cv_limit) {
                existingSubscription.download_cv_limit = true;
            }

            // existingSubscription.topUp.push({
            //     plane_name: TopupData.plane_name,
            //     plane_price: TopupData.plane_price,
            //     order_Id: orderId,
            //     Date: Date.now(),
            //     paymentMethods:paymentMethod
            // });
             await existingSubscription.save();

            const transaction = new CompanyTransaction({
                company_id: companyId,
                type: 'TopUp plane',
                Plane_name: TopupData.plane_name,
                price: TopupData.price,
                payment_method: paymentMethod,
                transaction_Id: orderId,
                purchesed_data: new Date(),
                Expire_date: existingSubscription.expiresAt
            });
            await transaction.save();

            return res.status(201).json({
                message:
                    'Payment verified and top-up plan applied successfully',
                paymentData: response.data,
                orderId:orderId
            });
        } else {
            return res.status(400).json({ error: 'payment failed' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};


//Early Subscription plane
exports.GetEarySubscriptionplane=async(req,res)=>{
    const {company_id}=req.params;
    try{
        const previousPlan=await CompanyTransaction.findOne({company_id,type:"Subscription",Plane_name:"Basic"})

        //const previousSubscription=await CompanySubscription.aggregate([{ $match: { company_id: objectId, expiresAt: { $gte: new Date() },createdDate:{$lte:new Date()}} }])
         if(previousPlan){
        const getSubscriptionPlans = await subscription.aggregate([
            { $match: {plane_name: { $ne: previousPlan.Plane_name } } }
           // { $match: { _id: { $ne: previousPlan.subscription_id } } }
        ]);
        return res.status(200).send({getSubscriptionPlans});
         }else{
            const getSubscriptionPlans = await subscription.find({})
            return res.status(200).send({getSubscriptionPlans});
         } 

    }catch(error){
        return res.status(500).json({error:"Iternal server error"});
    }
}

exports.EarlySubscriptionplane=async(req,res)=>{
    const apiUrl = 'https://sandbox.cashfree.com/pg/orders';
    const { company_id, sub_id} = req.body;
    try{
         const CmpId=new mongoose.Types.ObjectId(company_id)
        const CurrentSubscription=await CompanySubscription.aggregate([{
            $match: {
              expiresAt: { $gte: new Date() },
              createdDate:{$lte:new Date()},
              company_id:CmpId
            }
          }])
          
        const subscriptions = await subscription.findOne({ _id:sub_id});

        if (!subscriptions) {
            return res.status(404).json({ error: "Subscription plane not found" });
        }
        if (CurrentSubscription[0]?.plane_name == subscriptions?.plane_name) {
            return res.status(400).json({ error: `You are already using the ${subscriptions?.plane_name} plan.` });
        }

        const CompanyDate=await company.findOne({_id:company_id});
        const orderId = generateOrderId();
        const requestData = {
            customer_details: {
                customer_id: orderId,
                customer_email:CompanyDate.email,
                customer_phone: String(CompanyDate.mobile),
            },
            order_meta: {
                return_url: "http://65.20.91.47/main/subscription-plan/early-buy"
            },
            order_id:"order_"+orderId,
            order_amount:subscriptions?.price,
            order_currency: "INR",
            order_note: 'top Up plane',
            subscriptionid:sub_id
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-version': '2022-01-01',
                'x-client-id': process.env.CASHFREE_CLIENT_ID,
                'x-client-secret': process.env.CASHFREE_CLIENT_SECRET
            },
            body: JSON.stringify(requestData)
        };

        const response = await fetch(apiUrl, requestOptions);
        const responseData = await response.json();
          if (response.ok) {
            const orderData = {
                order_id: responseData.order_id,
                payment_methods:responseData.order_meta?.payment_methods || 'Not Provided',
                order_status: responseData.order_status,
                order_token: responseData.order_token,
                refundsurl: responseData.refunds ? responseData.refunds.url : 'N/A',
                company_id:company_id,
                sub_id: sub_id,
                paymentLink:responseData?.payment_link,
                amount:subscriptions?.price,
                customer_email:CompanyDate.email,
                customer_phone:CompanyDate.mobile,
            };
            res.status(200).json(orderData);
        } else {
            console.error('Error:', responseData);
            res.status(500).json({ error: "Internal server error" });
        }

    }catch(error){
        console.log(error)
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.SubscriptionPlaneVerifyPayment = async (req, res) => {
    const { orderId, sub_id, company_id,paymentMethod} = req.body;
    //const apiUrl = `https://api.cashfree.com/pg/orders/${orderId}`;
    const apiUrl = `https://sandbox.cashfree.com/pg/orders/${orderId}`
    const headers = {
      'x-client-id': process.env.CASHFREE_CLIENT_ID,
      'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
      'x-api-version': '2021-05-21',
    };
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: headers,
          });
      
          const result = await response.json();
      
            if (result.order_status === 'PAID') {
            const subData = await subscription.findById(sub_id);

            if (!subData) {
                return res.status(404).json({ error: "Subscription plan not found" });
            }
            const companyId=new mongoose.Types.ObjectId(company_id)
            const newExpirationDate =new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const newSubscription = new CompanySubscription({
                company_id: company_id,
                subscription_id: sub_id,
                plane_name: subData.plane_name,
                transaction_Id: orderId,
                price: subData.price,
                search_limit: subData.search_limit,
                available_candidate: subData.available_candidate,
                user_access: subData.user_access,
                cv_view_limit: subData.cv_view_limit,
                download_email_limit: subData.download_email_limit,
                download_cv_limit: subData.download_cv_limit,
                job_posting: subData.job_posting,
                Credibility_Search:subData.Credibility_Search,
                ai_question:subData.ai_question,
                    ai_job_description:subData.ai_job_description,
                    candidate_match:subData.candidate_match,
                    support:subData.support,
                createdDate: new Date(),
                expiresAt:newExpirationDate
            });
            await newSubscription.save();
            const transaction=new CompanyTransaction({
                company_id:companyId,
                type:'Early plane',
                Plane_name:subData.plane_name,
                price:subData.price,
                payment_method:paymentMethod,
                transaction_Id:orderId,
                purchesed_data:new Date(),
                Expire_date:newExpirationDate
            })
            await transaction.save();

            return res.status(201).json({
                message: "Payment verified and subscription created successfully",
                orderId:orderId
            });
        } else {
            return res.status(400).json({ error: "Payment not verified or payment failed" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
