const express = require("express");
const router = new express.Router();
const controller=require("../../controllers/Admin_controller/UserVerification_Controller");

//Company
router.get('/admin/verification/getcompany',controller.GetAllOnboardCompany);
router.put('/admin/verification/reject/:id',controller.OnboardCompanyRejectAction);
router.put('/admin/verification/approve/:id',controller.OnboardCompanyApproveAction);

//Candidate
router.get('/admin/verification/getcandidate',controller.GetAllOnboardCandidate);
router.put('/admin/verification/candidate/reject/:id',controller.OnboardCandidateRejectAction);
router.put('/admin/verification/candidate/approve/:id',controller.OnboardCandidateApproveAction);

//Verified Company
router.get('/admin/verified/getcompany',controller.GetAllVerifiedOnboardCompany);
//Verified Candidate
router.get('/admin/verified/getcandidate',controller.GetAllVerifiedOnboardCandidate);

module.exports=router;