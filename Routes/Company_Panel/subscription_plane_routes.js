const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Company_Controller/Subscription_controller')

router.get('/company/get_allsubscription',controller.getAllSubscriptionPlane);
router.get('/company/payment',controller.payment);
router.post('/company/verify',controller.verifyPayment);

router.get('/company/get_using_Subscription/:id',controller.getCompanyUsingSubscription);

//Extend subscription Plane
router.get('/company/extend/payment',controller.Extendpayment);
router.post('/company/extend/verify',controller.ExtendVerifyPayment);

//renew Subscription plane 
router.get('/company/get_renewplane/:company_id',controller.GetReNewSubscriptionPlan);
 router.get('/company/renewplane/payment',controller.RenewSubscriptionPlane);
 router.post('/company/renewPlane/verify',controller.RenewPlaneVerifyPayment);

 // topup plane
 router.get('/company/get_topup_plane/:company_id',controller.GetAllTopupPlane);


module.exports=router;