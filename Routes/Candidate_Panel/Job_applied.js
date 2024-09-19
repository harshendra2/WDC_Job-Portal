const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Candidate_Controller/Applied_Job_controller');

router.get('/candidate/appliedjob/:userId',controller.getAppliedJob);
router.get('/candidate/savedjob/:userId',controller.getSeavedjob);
//Job status flow map
router.get('/candidate/job_details/flow/:jobId',controller.GetjobDetailsInFlow);

module.exports=router;