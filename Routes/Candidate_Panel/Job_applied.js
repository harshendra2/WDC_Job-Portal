const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Candidate_Controller/Applied_Job_controller');

router.get('/candidate/appliedjob/:userId',controller.getAppliedJob);
router.get('/candidate/savedjob/:userId',controller.getSeavedjob);

module.exports=router;