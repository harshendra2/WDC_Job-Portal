const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Company_Controller/Credibility_Establish_controller')
const {upload}=require('../../middleware/multer');

router.get('/company/credibility/status/:cmpId',controller.GetCredibilityStatus);
router.get('/company/offer_verifier/:companyId/:PAN',controller.OfferVerifier);

//New offer letter offers to candidate
router.post('/company/new_candidate/offers/:cmpId',upload.single('file'),controller.uploadOfferLetter);

module.exports=router;