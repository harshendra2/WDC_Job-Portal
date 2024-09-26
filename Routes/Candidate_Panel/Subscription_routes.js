const express=require("express");
const router=new express.Router();
const controller=require('../../controllers/Candidate_Controller/Subscription_controller');

router.get('/candidate/get_currentusing/subscription/:userId',controller.GetCurrentSubscriptionPlane);
router.get('/candidate/get_allsubscription/:userId',controller.getAllSubscriptionPlane);
router.get('/candidate/get_payment/method',controller.getAllPaymentMethod);
router.post('/candidate/payment',controller.payment);
router.post('/candidate/verify',controller.verifyPayment);

module.exports=router;