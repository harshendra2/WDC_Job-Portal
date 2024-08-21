const crypto=require("crypto");
const {Cashfree}=require('cashfree-pg');
const mongoose=require("mongoose");
const subscription=require("../../models/SubscriptionSchema");
const CompanySubscription=require("../../models/Company_SubscriptionSchema");

// Configure Cashfree
Cashfree.XClientId = process.env.CLIENT_ID;
Cashfree.XClientSecret = process.env.CLIENT_SECRET;
Cashfree.XEnviornment = Cashfree.Environment.SANDBOX;

function generateOrderId() {
    return crypto.randomBytes(6).toString('hex');
}

exports.getAllSubscriptionPlane=async(req,res)=>{
    try{
        const data=await subscription.find({});
        if(data){
            return res.status(200).send(data);
        }else{
            return res.status(400).json({error:"Empty database"});
        }

    }catch(error){
        return res.status(500).json({error:"Internal Server error"});
    }
}

exports.payment = async (req, res) => {
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
exports.getCompanyUsingSubscription=async(req,res)=>{
    const {id}=req.params;
    try{
        const objectId = new mongoose.Types.ObjectId(id); 
        const data=await CompanySubscription.aggregate([{$match:{company_id:objectId}}]);
        if(data){
            return res.status(200).send(data);
        }else{
         return res.status(400).json({error:"This Company subscription plane not available"});
        }

    }catch(error){
     return res.status(500).json({error:"Internal Server Error"});
    }
}


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