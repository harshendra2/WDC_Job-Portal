const express=require('express');
const router=new express.Router();
const controller=require("../../controllers/Company_Controller/Create_Job_controller");

router.get('/company/job_remaining_status/:id',controller.GetRemainingJobStatus);
router.post('/company/create_job/:id',controller.CreateNewJob);
router.get('/company/get_postedjob/:id',controller.GetPostedJob);

module.exports=router;