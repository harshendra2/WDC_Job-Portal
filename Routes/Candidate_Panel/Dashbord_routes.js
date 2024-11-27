const router=require('express').Router();
let controller=require('../../controllers/Candidate_Controller/Dashboard_controller');

router.get('/candidate/dashboard/:userId',controller.GetSubscriptionStatus);
router.get('/candidate/dashboard/job/status/:userId/:start/:end',controller.GetAllJobStatus);

module.exports=router;