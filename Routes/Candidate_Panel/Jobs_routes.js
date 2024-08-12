const express=require("express");
const router=new express.Router();
const controller=require('../../controllers/Candidate_Controller/Jobs_controller');

router.get('/candidate/getunappliedjob/:id',controller.getUnappliedJob);
router.get('/candidate/getjobdetails/:id',controller.getJobDetails);
router.post('/candidate/jobapply/:userId/:jobId',controller.applyToJob);

//Saved Jobs
router.post('/candidate/savejob/:userId/:jobId',controller.saveJob)


module.exports=router;