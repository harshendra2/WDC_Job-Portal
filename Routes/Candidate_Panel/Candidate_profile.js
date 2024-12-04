const express=require('express');
const router=new express.Router();
const {upload}=require("../../middleware/multer")
const uploads = require("../../middleware/multiple_certificate_multer");
const controller=require('../../controllers/Candidate_Controller/profile_controller');

router.get('/candidate/profile/:id',controller.getProfilePercentageStatus);
router.put('/candidate/profile/add_summary/:userId',upload.single('file'),controller.AddSummaryToCandidate);
//add some work experience
 router.put('/candidate/profile/experience/:userId',controller.AddSomeWorkexperience);
 router.get('/candidate/profile/get_single/exp/:user_id/:exp_id',controller.getSingleWorkExp);
 router.put('/candidate/profile/edit_exp/:user_id/:exp_id',controller.EditExp);
 router.delete('/candidate/profile/delete_work/:work_id/:user_id',controller.DeleteWorkDetails);
//Add some Project Details
router.put('/candidate/profile/pojects/:userId',controller.AddSomeNewProjects);
router.get('/candidate/profile/get_single/project/:user_id/:project_id',controller.getSingleWorkedProject);
router.put('/candidate/profile/edit_project/:user_id/:project_id',controller.EditProject);
router.delete('/candidate/profile/delete_projects/:project_id/:user_id',controller.DeleteProjectDetails);

 //edit Basic details 
 router.get('/candidate/profile/get_basic/:user_id',controller.GetBasicDetails);
 router.put('/candidate/profile/edit_basic/:user_id',controller.EditBasicDetails);

 //Edit personal details
 router.get('/candidate/profile/get_personal/:user_id',controller.GetPersonlDetails);

 router.post('/candidate/profile/aadhar_verification/verify',controller.AadharVerification);
 router.post('/candidate/aadhar_otp/:userId',controller.aadharOtpVerification);

 router.post('/candidate/pan_verification/:userId',controller.PanKYCverification);
 
 router.put('/candidate/profile/edit_personal/:user_id',controller.EditPersonalDetails);

 //Edit work details
 router.get('/candidate/profile/get_work/:user_id',controller.GetworkDetails);
 router.put('/candidate/profile/edit_work/:user_id',upload.single("file"),controller.EditWorkDetails);

 //Edit Education details
 router.get('/candidate/profile/get_education/:user_id',controller.GetEducationDetails);
 router.put('/candidate/profile/add_education/:user_id',upload.single('file'),controller.AddNewAducation);
 router.put('/candidate/profile/edit_education/:user_id',uploads,controller.EditEducationDetails);
 router.delete('/candidate/profile/delete_education/:user_id/:education_id',controller.DeleteEducation);
 //Reviews
 router.get('/candidate/review/:user_id',controller.GetAllCompanyReview);
 //Candidate Profile percenteage
 router.get('/candidate/profile/percentage/:userId',controller.GetProfilePercentage);

 //Resume write Count  
 router.get('/candidate/resume_create/job_desc/:jobId',controller.ResumeGenerateBaseJobDesc);
router.get('/candidate/resume_generate/count/:cmpId',controller.ResumeGenerateCount);


module.exports=router;