const express=require("express");
const router=new express.Router();
const controller=require('../../controllers/Candidate_Controller/Support_Controller');
const { upload } = require("../../middleware/multer");

router.post('/candidate/add_issue/:userId',upload.single('file'),controller.AddNewIssue);
router.get('/candidate/get_issue/:userId',controller.getAllIssuesClaim);

router.post('/candidate/send/mail/:userId',upload.single('file'),controller.SendMailSupport);

//Transaction
router.get('/candidate/transaction/:userId',controller.getTransaction);

module.exports=router; 