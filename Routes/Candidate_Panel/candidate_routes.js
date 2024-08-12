const express=require("express");
const router=new express.Router();
const controller=require("../../controllers/Candidate_Controller/Cridential_controller");

router.post('/candidate/reg',controller.Registration);
router.post('/candidate/login',controller.login);
router.post('/candidate/forgotpassword',controller.forgotPassword);
router.post('/candidate/newpassword',controller.NewPassword)

module.exports=router;