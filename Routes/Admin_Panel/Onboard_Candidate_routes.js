const express = require("express");
const router = new express.Router();
const controller = require("../../controllers/Admin_controller/Onboard_CandidateCantroller");
const { upload } = require("../../middleware/multer");
const multer=require('multer');
const uploads = multer({ dest: 'uploads/' });

router.post('/admin/create_basicdetails_candidate', controller.createBasicDetaileCandidate);
router.post('/admin/create_personaldetails',controller.createPersonalDetailsCandidate);
router.post('/admin/create_workdetails',controller.createWorkDetailsCandidate);
router.post('/admin/create_educationdetails',upload.single("file"),controller.createEducationDetailsCandidate);
router.get('/admin/get_candidate',controller.getAllCandidate);

router.get('/admin/get_basicdetails/:id',controller.getbasicDetails);
router.put('/admin/edit_basicdetails/:id',controller.editBasicDetails);

router.get('/admin/get_personaldetaild/:id',controller.getPersonalDetails);
router.put('/admin/edit_personaldetails/:id',controller.editPersonalDetails);

router.get('/admin/get_workdetaild/:id',controller.getWorkdetails);
router.put('/admin/edit_workdetails/:id',controller.editWorkDetails);

router.get('/admin/get_educationdetaild/:id',controller.getEducationData);
router.put('/admin/edit_educationdetails/:id',upload.single("file"),controller.editEducationDetails);

// download Excel and upload Excel Sheets
router.get('/admin/download-excel-template',controller.DownloadExcelTemplete);
router.post('/admin/upload-excel', upload.single('file'),controller.uploadExcelFile);

module.exports = router;
