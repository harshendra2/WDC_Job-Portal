const crypto=require("crypto");
const { Cashfree } = require('cashfree-pg');
const mongoose=require("mongoose");
const subscription=require("../../models/Candidate_SubscriptionSchema");
const UserSubscription=require("../../models/Current_Candidate_SubscriptionSchema");

// Configure Cashfree
Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
Cashfree.XEnviornment = Cashfree.Environment.SANDBOX;

function generateOrderId() {
    return crypto.randomBytes(6).toString('hex');
}

exports.GetCurrentSubscriptionPlane=async(req,res)=>{
    const {userId}=req.params;
    try{
        const Id=new mongoose.Types.ObjectId(userId);
        const CurrentSubscription=await UserSubscription.aggregate([{
            $match: {
              expiresAt: { $gte: new Date() },
              candidate_id: Id
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
    const {userId}=req.params;
    try{
        const user_id=new mongoose.Types.ObjectId(userId);
        const previousPlan = await UserSubscription.findOne({
            user_id,
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
    const { orderId, subscriptionId, userId } = req.body;

    try {
        // const response = await Cashfree.PGOrderFetchPayment(orderId);

        // if (response && response.data && response.data.order_status === 'PAID') {
            const data = await subscription.findById(subscriptionId);

            if (data) {
                const subdata = new UserSubscription({
                    candidate_id: userId,
                    subscription_id:subscriptionId,
                    plane_name: data.plane_name,
                    transaction_Id:orderId,
                    price: data.price,
                    top_candidate:data.top_candidate,
                    createdDate: new Date(),
                    expiresAt: new Date(Date.now() + 30*24*60*60*1000), // Set expiration date to 30 days from now
                });
                await subdata.save();

                return res.status(201).json({
                    message: "Payment verified and subscription created successfully",
                    // paymentData: response.data,
                    subscriptionData: subdata
                });
            } else {
                return res.status(404).json({ error: "Subscription plan not found" });
            }
        // } else {
        //     return res.status(400).json({ error: "Payment not verified or payment failed" });
        // }

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal Server Error" });
    }
};