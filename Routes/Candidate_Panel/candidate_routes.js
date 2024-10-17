const express=require("express");
const router=new express.Router();
const controller=require("../../controllers/Candidate_Controller/Cridential_controller");

router.post('/candidate/reg',controller.Registration);

//Green Batch
router.post('/candidate/green_tick/payment',controller.CandidateGreenTicks);
 router.post('/candidate/green_tick/verify',controller.GreenTickVerifyPayment);

module.exports=router;