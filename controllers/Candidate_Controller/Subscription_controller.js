const crypto=require("crypto");
const mongoose=require("mongoose");
const subscription=require("../../models/Candidate_SubscriptionSchema");
const UserSubscription=require("../../models/Current_Candidate_SubscriptionSchema");
const candidate=require("../../models/Onboard_Candidate_Schema")
const CandidateTransaction=require("../../models/CandidateTransactionSchema");

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
              createdDate:{$lte:new Date()},
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
    const apiUrl = 'https://sandbox.cashfree.com/pg/orders';
    const { userId, subId } = req.body;

    try {
        if (!userId || !subId) {
            return res.status(400).json({ error: "Please provide userId and subId" });
        }

        const orderId = generateOrderId();
        const candidate_id = new mongoose.Types.ObjectId(userId);
        const candidates = await candidate.findById(candidate_id).populate('basic_details');
        if (!candidates) {
            return res.status(404).json({ error: "Candidate not found" });
        }
        const subscriptions = await subscription.findById(subId);
        if (!subscriptions) {
            return res.status(404).json({ error: "Subscription not found" });
        }

        const requestData = {
            customer_details: {
                customer_id: orderId,
                customer_email: candidates?.basic_details?.email || 'N/A',
                customer_phone: String(candidates?.basic_details?.mobile || 'N/A'),
            },
            order_meta: {
                return_url: `https://didatabank.com/PaymentSuccessfull?order_id=order_${orderId}`
            },
            order_id: `order_${orderId}`,
            order_amount: subscriptions.price,
            order_currency: "INR",
            order_note: 'Upgrade Subscription',
            subscription_id: subId
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
                payment_methods: responseData.order_meta?.payment_methods || 'Not Provided',
                order_status: responseData.order_status,
                order_token: responseData.order_token,
                refunds_url: responseData.refunds ? responseData.refunds.url : 'N/A',
                company_id: userId,
                subscription_id: subId,
                amount: subscriptions.price,
                payment_link: responseData?.payment_link,
                customer_email: candidates?.basic_details?.email || 'N/A',
                customer_phone: candidates?.basic_details?.mobile || 'N/A',
            };
            return res.status(200).json(orderData);
        } else {
            console.error('Error:', responseData);
            return res.status(500).json({ error: "Failed to create order with Cashfree" });
        }

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};


exports.verifyPayment = async (req, res) => {
    const { orderId, subscriptionId, userId,paymentMethod } = req.body;
    const apiUrl = `https://sandbox.cashfree.com/pg/orders/${orderId}`;
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
                const candidates=await candidate.findById(userId)
            const data = await subscription.findById(subscriptionId);

            if (data) {
                const subdata = new UserSubscription({
                    candidate_id: userId,
                    custom_id:candidates?.custom_id,
                    subscription_id:subscriptionId,
                    plane_name: data.plane_name,
                    transaction_Id:orderId,
                    price: data.price,
                    top_candidate:data.top_candidate,
                    createdDate: new Date(),
                    expiresAt: new Date(Date.now() + 30*24*60*60*1000), // Set expiration date to 30 days from now
                });
                await subdata.save();

                const transaction=new CandidateTransaction({
                    candidate_id:userId,
                    type:'Subscription',
                    Plane_name: data.plane_name,
                    price:data.price,
                    payment_method:paymentMethod,
                    transaction_Id:orderId,
                    purchesed_data:new Date(),
                    Expire_date:new Date(Date.now() + 30*24*60*60*1000)
                })
                await transaction.save();

                return res.status(201).json({
                    message: "Payment verified and subscription created successfully",
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