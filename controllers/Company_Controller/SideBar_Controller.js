const mongoose=require("mongoose");
const crypto=require("crypto");
const company=require('../../models/Onboard_Company_Schema');
const VerifiedBatchPlaneSchema=require('../../models/Green_Tick_Schema');
const companyTransaction=require('../../models/CompanyTransactionSchema');

function generateOrderId() {
    return crypto.randomBytes(6).toString('hex');
}


exports.CompanyGreenTicks=async(req,res)=>{
    const { company_id, green_id} = req.body;
    const apiUrl = 'https://sandbox.cashfree.com/pg/orders';

    try{
        const companyData=await company.findOne({_id:company_id});

        const subscription = await VerifiedBatchPlaneSchema.findOne({ _id:green_id});
        
        if (!subscription) {
            return res.status(404).json({ error: "Subscription plane not found" });
        }
        const orderId = generateOrderId();

        const requestData = {
            customer_details: {
                customer_id: orderId,
                customer_email:companyData.email,
                customer_phone: String(companyData.mobile),
            },
            order_meta: {
                return_url: "https://law-tech.co.in/PaymentSuccessfull?order_id=order_"+orderId
            },
            order_id:"order_"+orderId,
            order_amount: 1999,
            order_currency: "INR",
            order_note: 'Green Tick Batch',
            subscriptionid:green_id
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
                subscription_id: green_id,
                paymentLink:responseData?.payment_link,
                amount: price,
                customer_email:companyData.email,
                customer_phone:companyData.mobile,
            };
            res.status(200).json(orderData);
        } else {
            console.error('Error:', responseData);
            res.status(500).json({ error: "Internal server error" });
        }

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.GreenTickVerifyPayment = async (req, res) => {
    const { orderId, green_id, company_id,paymentMethod} = req.body;
    const apiUrl = `https://api.cashfree.com/pg/orders/${orderId}`;
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
                      orderId:orderId,
                      paymentMethod:paymentMethod
                }

                const updatedWorkDetails = await company.findByIdAndUpdate(
                    company_id,
                    { $push: { verified_batch: verifiedData } }, 
                    { new: true }
                  );

                  const transaction=new companyTransaction({
                    company_id:company_id,
                    type:'Green Batch plane',
                    Plane_name:subData.batch_name,
                    price:subData.price,
                    payment_method:paymentMethod,
                    transaction_Id:orderId,
                    purchesed_data:new Date(),
                    Expire_date:newExpirationDate
                })
                await transaction.save();

            return res.status(201).json({
                message: "Payment verified and subscription created successfully",
                paymentData: response.data,
                updatedCompanyDetails: updatedWorkDetails
            });
        } else {
            return res.status(400).json({ error: "Payment not verified or payment failed" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

