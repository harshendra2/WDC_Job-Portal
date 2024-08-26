const express = require("express");
const router = new express.Router();
const controller = require("../../controllers/Admin_controller/Onboard_CandidateCantroller");
const { upload } = require("../../middleware/multiple_certificate_multer");
const multer=require('multer');

router.post('/admin/create_basicdetails_candidate', controller.createBasicDetaileCandidate);
router.post('/admin/create_personaldetails',controller.createPersonalDetailsCandidate);
router.post('/admin/create_workdetails',upload.single("file"),controller.createWorkDetailsCandidate);
router.post('/admin/create_educationdetails',upload.array('certificates', 10),controller.createEducationDetailsCandidate);
router.get('/admin/get_candidate',controller.getAllCandidate);

router.get('/admin/get_basicdetails/:id',controller.getbasicDetails);
router.put('/admin/edit_basicdetails/:id',controller.editBasicDetails);

router.get('/admin/get_personaldetaild/:id',controller.getPersonalDetails);
router.put('/admin/edit_personaldetails/:id',controller.editPersonalDetails);

router.get('/admin/get_workdetaild/:id',controller.getWorkdetails);
router.put('/admin/edit_workdetails/:id',upload.single("file"),controller.editWorkDetails);

router.get('/admin/get_educationdetaild/:id',controller.getEducationData);
router.put('/admin/edit_educationdetails/:id',upload.array('certificates', 10),controller.editEducationDetails);

// download Excel and upload Excel Sheets
router.get('/admin/candidate/download-excel-template',controller.DownloadExcelTemplate);
router.post('/admin/candidate/upload-excel',upload.single('file'),controller.uploadExcelFile);

module.exports = router;
