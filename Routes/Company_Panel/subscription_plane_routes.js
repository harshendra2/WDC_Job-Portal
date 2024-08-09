const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Company_Controller/Subscription_controller')

router.get('/company/get_allsubscription',controller.getAllSubscriptionPlane);
router.get('/company/payment',controller.payment);
router.post('/company/verify',controller.verifyPayment);

module.exports=router;