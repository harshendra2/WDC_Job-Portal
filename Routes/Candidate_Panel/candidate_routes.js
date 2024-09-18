const express=require("express");
const router=new express.Router();
const controller=require("../../controllers/Candidate_Controller/Cridential_controller");

router.post('/candidate/reg',controller.Registration);

module.exports=router;