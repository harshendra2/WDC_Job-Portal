const mongoose=require("mongoose");
const crypto=require("crypto");
const {Cashfree}=require('cashfree-pg');
const company=require('../../models/Onboard_Company_Schema');
const VerifiedBatchPlaneSchema=require('../../models/Green_Tick_Schema');

// Configure Cashfree
Cashfree.XClientId = process.env.CLIENT_ID;
Cashfree.XClientSecret = process.env.CLIENT_SECRET;
Cashfree.XEnviornment = Cashfree.Environment.SANDBOX;

function generateOrderId() {
    return crypto.randomBytes(6).toString('hex');
}


exports.CompanyGreenTicks=async(req,res)=>{
    const { company_id, green_id, mobile, name, email } = req.body;

    if (!mobile || !name || !email) {
        return res.status(400).json({ error: "All fields are required: price, mobile, name, email" });
    }
    try{

        const subscription = await VerifiedBatchPlaneSchema.findOne({ _id:green_id});
        
        if (!subscription) {
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
        return res.json(response.data);

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.GreenTickVerifyPayment = async (req, res) => {
    const { orderId, green_id, company_id } = req.body;
    
    try {
        // const response = await Cashfree.PGOrderFetchPayment(orderId);

        // if (response && response.data && response.data.order_status === 'PAID') {
            const subData = await VerifiedBatchPlaneSchema.findById(green_id);

            if (!subData) {
                return res.status(404).json({ error: "Plan not found" });
            }


            const newExpirationDate = new Date(Date.now() + response?.month * 30 * 24 * 60 * 60 * 1000);

                const verifiedData={
                    batch_name:subData?.batch_name,
                      price:subData?.price,
                      ExpireDate:newExpirationDate,
                      Date:new Date(),
                      orderId:orderId
                }

                const updatedWorkDetails = await company.findByIdAndUpdate(
                    company_id,
                    { $push: { verified_batch: verifiedData } }, 
                    { new: true }
                  );

            return res.status(201).json({
                message: "Payment verified and subscription created successfully",
                paymentData: response.data,
                updatedCompanyDetails: updatedWorkDetails
            });
        // } else {
        //     return res.status(400).json({ error: "Payment not verified or payment failed" });
        // }
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

