const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Company_Controller/Support_controller');

router.post('/company/add_issue/:id',controller.AddNewIssue);

module.exports=router;