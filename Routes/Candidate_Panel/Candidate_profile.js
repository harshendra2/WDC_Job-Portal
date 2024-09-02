const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Candidate_Controller/profile_controller');

router.get('/condidate/profile/:id',controller.getProfilePercentageStatus);
router.get('/candidate/profile/:candidate_id/:expr_id',controller.EditExperiencData);

module.exports=router;