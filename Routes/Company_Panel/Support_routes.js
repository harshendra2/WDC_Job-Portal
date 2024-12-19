const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Company_Controller/Support_controller');
const { upload } = require("../../middleware/multer");

router.post('/company/add_issue/:id',upload.single('file'),controller.AddNewIssue);
router.get('/company/get_issue/:companyId',controller.getAllIssuesClaim);


//Temp data 
router.post('/company/get/accesstoken',controller.CreateAccesstoken);
router.post('/company/refresh/token',controller.GenerateAccesToken);
router.post('/company/get/all/data',controller.GetALLDATAfromZOHO);

module.exports=router;