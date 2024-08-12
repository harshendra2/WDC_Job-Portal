const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Company_Controller/Support_controller');
const { upload } = require("../../middleware/multer");

router.post('/company/add_issue/:id',upload.single('file'),controller.AddNewIssue);
router.get('/company/get_issue/:id',controller.getAllIssuesClaim);

//Chating Routes
router.post("/company/createchat",controller.createChat);
router.get("/company/:userId",controller.findUserChats);
router.get("/company/find/:firstId/:secondId",controller.findChat);

//Message Routes
router.post("/company/createmessage",controller.createMessage);
router.get("/company/:chatId",controller.getMessages);


module.exports=router;