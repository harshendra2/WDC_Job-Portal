const express = require("express");
const router = new express.Router();
const controller = require("../controllers/Onboard_CandidateCantroller");
const { upload } = require("../middleware/multer");

router.post('/admin/create_basicdetails_candidate',upload.single("file"), controller.createBasicDetaileCandidate);
router.post('/admin/create_personaldetails',controller.createPersonalDetailsCandidate);
router.post('/admin/create_workdetails',controller.createWorkDetailsCandidate)
router.post('/admin/create_educationdetails',controller.createEducationDetailsCandidate)

module.exports = router;
