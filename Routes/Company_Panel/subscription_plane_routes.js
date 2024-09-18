const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Company_Controller/Subscription_controller')

router.get('/company/get_currentusing/subscription/:companyId',controller.GetCurrentSubscriptionPlane);
router.get('/company/get_allsubscription/:companyId',controller.getAllSubscriptionPlane);
router.get('/company/get_payment/method',controller.getAllPaymentMethod);
router.get('/company/payment',controller.payment);
router.post('/company/verify',controller.verifyPayment);

//Extend subscription Plane
router.get('/company/extend/payment',controller.Extendpayment);
router.post('/company/extend/verify',controller.ExtendVerifyPayment);

//renew Subscription plane 
router.get('/company/get_renewplane/:company_id',controller.GetReNewSubscriptionPlan);
 router.get('/company/renewplane/payment',controller.RenewSubscriptionPlane);
 router.post('/company/renewPlane/verify',controller.RenewPlaneVerifyPayment);

 // topup plane
 router.get('/company/get_topup_plane/:company_id',controller.GetAllTopupPlane);
 router.get('/company/topup_plane/payment',controller.TopUpSubscriptionPlane);
 router.post('/company/renewPlane/verify',controller.TopUpPlaneVerifyPayment);

 //Eary buying 
 router.get('/company/get_earlysubcription/:company_id',controller.GetEarySubscriptionplane);
 router.get('/company/early_plane/payment',controller.EarlySubscriptionplane);
 router.post('/company/early_subscription/verify',controller.SubscriptionPlaneVerifyPayment);


module.exports=router;