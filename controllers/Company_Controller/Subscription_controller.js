const crypto=require("crypto");
const { Cashfree } = require('cashfree-pg');
const mongoose=require("mongoose");
const subscription=require("../../models/SubscriptionSchema");
const CompanySubscription=require("../../models/Company_SubscriptionSchema");
const TopUpPlane=require("../../models/ToupPlane");

// Configure Cashfree
Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
Cashfree.XEnviornment = Cashfree.Environment.SANDBOX;

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
        const previousPlan = await CompanySubscription.findOne({
            company_id,
            plane_name: { $regex: /^Basic\s*$/, $options: 'i' } 
        });
         if(previousPlan){
        const getSubscriptionPlans = await subscription.aggregate([
            { $match: { _id: { $ne: previousPlan.subscription_id } } }
        ]);
        return res.status(200).send({getSubscriptionPlans});
         }else{
            const getSubscriptionPlans = await subscription.find({})
            return res.status(200).send({getSubscriptionPlans});
         } 

    }catch(error){
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
    const {price,id,mobile,name,email}=req.body;
    if (!price|| !mobile || !name || !email) {
        return res.status(400).json({ error: "All fields are required: price,mobile,name,email" });
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
};

exports.verifyPayment = async (req, res) => {
    const { orderId, subscriptionId, companyId } = req.body;

    try {
        const response = await Cashfree.PGOrderFetchPayment(orderId);

        if (response && response.data && response.data.order_status === 'PAID') {
            const data = await subscription.findById(subscriptionId);

            if (data) {
                const subdata = new CompanySubscription({
                    company_id: companyId,
                    subscription_id:subscriptionId,
                    plane_name: data.plane_name,
                    transaction_Id:orderId,
                    price: data.price,
                    search_limit: data.search_limit,
                    available_candidate: data.available_candidate,
                    user_access: data.user_access,
                    cv_view_limit: data.cv_view_limit,
                    download_email_limit: data.download_email_limit,
                    download_cv_limit: data.download_cv_limit,
                    job_posting: data.job_posting,
                    createdDate: new Date(),
                    expiresAt: new Date(Date.now() + 30*24*60*60*1000), // Set expiration date to 30 days from now
                });
                await subdata.save();

                return res.status(201).json({
                    message: "Payment verified and subscription created successfully",
                    paymentData: response.data,
                    subscriptionData: subdata
                });
            } else {
                return res.status(404).json({ error: "Subscription plan not found" });
            }
        } else {
            return res.status(400).json({ error: "Payment not verified or payment failed" });
        }

    } catch (error) {
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
        const previousPlan = await CompanySubscription.findOne({
            company_id,
            plane_name: { $regex: /^Basic\s*$/, $options: 'i' } 
        });
        const objectId=new mongoose.Types.ObjectId(company_id);
        const previousSubscription=await CompanySubscription.aggregate([{ $match: { company_id: objectId, expiresAt: { $gte: new Date() } } }])
         if(previousPlan){
        const getSubscriptionPlans = await subscription.aggregate([
            { $match: { _id: { $ne: previousPlan.subscription_id } } }
        ]);
        return res.status(200).send({getSubscriptionPlans,previousSubscription});
         }else{
            const getSubscriptionPlans = await subscription.find({})
            return res.status(200).send({getSubscriptionPlans,previousSubscription});
         } 

    } catch (error) {
       return res.status(500).json({error:"Internal server error"});
    }
}

exports.RenewSubscriptionPlane = async (req, res) => {
    const { company_id, subscription_id, price, mobile, name, email } = req.body;

    if (!price || !mobile || !name || !email) {
        return res.status(400).json({ error: "All fields are required: price, mobile, name, email" });
    }

    try {

        const subscription = await subscription.findOne({ _id: subscription_id });
        
        if (!subscription) {
            return res.status(404).json({ error: "Subscription not found" });
        }
        const orderId = generateOrderId();

        const request = {
            "order_amount": price,
            "order_currency": "INR",
            "order_id": orderId,
            "customer_details": {
                "customer_id": company_id, 
                "customer_phone": mobile,
                "customer_name": name,
                "customer_email": email,
            }
        };
        const response = await Cashfree.PGCreateOrder(request);
        return res.json(response.data);

    } catch (error) {
        console.error(error); 
        return res.status(500).json({ error: "Internal server error" });
    }
};


exports.RenewPlaneVerifyPayment = async (req, res) => {
    const { orderId, subscriptionId, companyId,paymentMethod} = req.body;
    try {
        const response = await Cashfree.PGOrderFetchPayment(orderId);

        if (response && response.data && response.data.order_status === 'PAID') {
            const subscriptionData = await subscription.findById(subscriptionId);

            if (subscriptionData) {
                const existingSubscriptions = await CompanySubscription.find({ 
                    company_id: companyId 
                }).sort({ createdDate: -1 }).limit(1);

                if (existingSubscriptions.length > 0) {
                    const existingSubscription = existingSubscriptions[0];
                    // Reset the limits of the existing subscription
                    existingSubscription.search_limit = 0;
                    existingSubscription.user_access = 0;
                    existingSubscription.cv_view_limit = 0;
                    existingSubscription.job_posting = 0;
                    existingSubscription.available_candidate = false;
                    existingSubscription.download_email_limit = false;
                    existingSubscription.download_cv_limit = false;
                    existingSubscription.paymentMethod=paymentMethod;
                    await existingSubscription.save();
                }

                // Create a new subscription for the company
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
                    paymentMethod:paymentMethod,
                    createdDate: new Date(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
                });
                await newSubscription.save();

                return res.status(201).json({
                    message: "Payment verified and Subscription plan is renewed successfully",
                    paymentData: response.data,
                    subscriptionData: newSubscription
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
        const currentPlan = await CompanySubscription.findOne({ company_id })
            .sort({ createdDate: -1 })
            .limit(1);

        if (!currentPlan) {
            return res.status(404).json({ error: "No subscription plan found for the company." });
        }
        async function getTopUpPlane(fieldName) {
            const fieldValue = currentPlan[fieldName];
            if (typeof fieldValue === 'string' && fieldValue === 'Unlimited') {
                return await TopUpPlane.findOne({ [fieldName]: 'Unlimited' });
            } else if (typeof fieldValue === 'boolean') {
                return await TopUpPlane.findOne({ [fieldName]: true });
            } else if (typeof fieldValue === 'number' && fieldValue!=0) {
                return await TopUpPlane.findOne({ [fieldName]: { $ne: fieldValue } });
            }

            return null;
        }

        let topupArray = [];

        function isDuplicate(data) {
            return topupArray.some(item => item.plane_name == data.plane_name);
        }
        for (const topUp of currentPlan.topUp) {
            const data = await TopUpPlane.findOne({ plane_name: topUp.plane_name });
            if (data && !isDuplicate(data)) {
                topupArray.push(data);
            }
        }
        const fieldNames = [
            'search_limit',
            'cv_view_limit',
            'job_posting',
            'available_candidate',
            'user_access',
            'download_email_limit',
            'download_cv_limit'
        ];

        for (const fieldName of fieldNames) {
            const data = await getTopUpPlane(fieldName);
            if (data && !isDuplicate(data)) {
                topupArray.push(data);
            }
        }
        return res.status(200).json(topupArray);

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};


exports.TopUpSubscriptionPlane=async(req,res)=>{
    const { company_id, topup_id, price, mobile, name, email } = req.body;

    if (!price || !mobile || !name || !email) {
        return res.status(400).json({ error: "All fields are required: price, mobile, name, email" });
    }
    try{

        const subscription = await TopUpPlane.findOne({ _id:topup_id});
        
        if (!subscription) {
            return res.status(404).json({ error: "TopUp plane not found" });
        }
        const orderId = generateOrderId();

        const request = {
            "order_amount": price,
            "order_currency": "INR",
            "order_id": orderId,
            "customer_details": {
                "customer_id": company_id, 
                "customer_phone": mobile,
                "customer_name": name,
                "customer_email": email,
            }
        };
        const response = await Cashfree.PGCreateOrder(request);
        return res.json(response.data);

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}


exports.TopUpPlaneVerifyPayment = async (req, res) => {
    const { orderId, topupId, companyId,paymentMethod} = req.body;

    try {
        const response = await Cashfree.PGOrderFetchPayment(orderId);

        if (response && response.data && response.data.order_status === 'PAID') {
            const TopupData = await TopUpPlane.findById(topupId);

            if (!TopupData) {
                return res.status(404).json({ error: "Top-up plan not found" });
            }

            const existingSubscription = await CompanySubscription.findOne({ 
                company_id: companyId 
            }).sort({ createdDate: -1 });

            if (!existingSubscription) {
                return res.status(404).json({ error: "No subscription found for the company" });
            }

            existingSubscription.search_limit += TopupData.search_limit || 0;
            existingSubscription.user_access += TopupData.user_access || 0;
            existingSubscription.cv_view_limit += TopupData.cv_view_limit || 0;
            existingSubscription.job_posting += TopupData.job_posting || 0;
            
            if (TopupData.available_candidate) {
                existingSubscription.available_candidate = true;
            }
            if (TopupData.download_email_limit) {
                existingSubscription.download_email_limit = true;
            }
            if (TopupData.download_cv_limit) {
                existingSubscription.download_cv_limit = true;
            }

            existingSubscription.topUp.push({
                plane_name: TopupData.plane_name,
                plane_price: TopupData.plane_price,
                order_Id: orderId,
                Date: Date.now(),
                paymentMethods:paymentMethod
            });
            await existingSubscription.save();

            return res.status(201).json({
                message: "Payment verified and top-up plan applied successfully",
                paymentData: response.data
            });
        } else {
            return res.status(400).json({ error: "payment failed" });
        }

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};


//Early Subscription plane
exports.GetEarySubscriptionplane=async(req,res)=>{
    const {company_id}=req.params;
    try{

        const previousPlan = await CompanySubscription.findOne({
            company_id,
            plane_name: { $regex: /^Basic\s*$/, $options: 'i' } 
        });

        const objectId=new mongoose.Types.ObjectId(company_id);
        const previousSubscription=await CompanySubscription.aggregate([{ $match: { company_id: objectId, expiresAt: { $gte: new Date() } } }])
         if(previousPlan){
        const getSubscriptionPlans = await subscription.aggregate([
            { $match: { _id: { $ne: previousPlan.subscription_id } } }
        ]);
        return res.status(200).send({getSubscriptionPlans,previousSubscription});
         }else{
            const getSubscriptionPlans = await subscription.find({})
            return res.status(200).send({getSubscriptionPlans,previousSubscription});
         } 

    }catch(error){
        return res.status(500).json({error:"Iternal server error"});
    }
}

exports.EarlySubscriptionplane=async(req,res)=>{
    const { company_id, sub_id, price, mobile, name, email } = req.body;

    if (!price || !mobile || !name || !email) {
        return res.status(400).json({ error: "All fields are required: price, mobile, name, email" });
    }
    try{

        const subscriptions = await subscription.findOne({ _id:sub_id});
        
        if (!subscriptions) {
            return res.status(404).json({ error: "Subscription plane not found" });
        }
        const orderId = generateOrderId();

        const request = {
            "order_amount": price,
            "order_currency": "INR",
            "order_id": orderId,
            "customer_details": {
                "customer_id": company_id, 
                "customer_phone": mobile,
                "customer_name": name,
                "customer_email": email,
            }
        };
         const response = await Cashfree.PGCreateOrder(request);
    res.status(200).json(response);
    }catch(error){
        console.log(error)
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.SubscriptionPlaneVerifyPayment = async (req, res) => {
    const { orderId, sub_id, companyId,paymentMethod} = req.body;
    
    try {
        const response = await Cashfree.PGOrderFetchPayment(orderId);

        if (response && response.data && response.data.order_status === 'PAID') {
            const subData = await subscription.findById(sub_id);

            if (!subData) {
                return res.status(404).json({ error: "Subscription plan not found" });
            }

            const previousPlan = await CompanySubscription.findOne({ company_id: companyId })
                .sort({ createdDate: -1 })
                .limit(1);

            const newExpirationDate = previousPlan
                ? new Date(previousPlan.expiresAt).getTime() + 30 * 24 * 60 * 60 * 1000
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const newSubscription = new CompanySubscription({
                company_id: companyId,
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
                createdDate: new Date(previousPlan.expiresAt),
                expiresAt: new Date(newExpirationDate),
                paymentMethod:paymentMethod
            });
            await newSubscription.save();

            return res.status(201).json({
                message: "Payment verified and subscription created successfully",
                paymentData: response.data,
                subscriptionData: newSubscription
            });
        } else {
            return res.status(400).json({ error: "Payment not verified or payment failed" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
