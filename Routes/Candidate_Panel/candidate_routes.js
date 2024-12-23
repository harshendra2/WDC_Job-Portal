const express=require("express");
const router=new express.Router();
const controller=require("../../controllers/Candidate_Controller/Cridential_controller");

router.post('/candidate/reg',controller.Registration);

//Green Batch
router.post('/candidate/green_tick/payment',controller.CandidateGreenTicks);
router.post('/candidate/green_tick/verify',controller.GreenTickVerifyPayment);

//ZOHO CREATOR API
router.post('/candidate/get/code',controller.CreatCode);
router.post('/candidate/get/accesstoken/refreshtoken',controller.GetAccessAndRefreshToken);
//refresh access token
//router.post('/candidate/get/refresh/token',controller.GenerateAccesToken);
router.post('/candidate/get/all_data/reporter',controller.GetAllDataFromZohoReport);


router.delete('/candidate/delete/candidate',controller.DeleteAllCandidate);

module.exports=router;