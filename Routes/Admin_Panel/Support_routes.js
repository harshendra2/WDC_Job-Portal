const express = require("express");
const router = new express.Router();
const controller=require('../../controllers/Admin_controller/Support_controller');

router.get('/admin/get_issue/:page/:limit',controller.getAllIssuesClaim);

// Action status
router.put('/admin/status/reject/:id',controller.RejectionStatus);
router.put('/admin/status/resolve/:id',controller.ResolvedStatus);

module.exports=router;