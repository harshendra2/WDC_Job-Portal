const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Company_Controller/Credibility_Establish_controller')

router.get('/company/credibility/status/:cmpId',controller.GetCredibilityStatus);
router.get('/company/offer_verifier/:companyId/:PAN',controller.OfferVerifier);


module.exports=router;