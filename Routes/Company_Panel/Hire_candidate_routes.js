const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Company_Controller/Hire_candidate_controller');

router.get('/company/get_appliedcandidate/:id',controller.getAllAppliedCandidate);
router.get('/company/get_candidatedetails/:userId',controller.getCandidateDetails);

module.exports=router;