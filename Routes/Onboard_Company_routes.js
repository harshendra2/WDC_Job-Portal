const express = require("express");
const router = new express.Router();
const controller = require("../controllers/Onboard_CompanyController");

router.post('/admin/create_company', controller.createOnboardCompany);
router.get('/admin/get_company',controller.getAllOnboardCompany);
router.get('/admin/get_single_company/:id', controller.getSingleCompany);
router.put('/admin/edit_company/:id', controller.editOnboardCompany);

module.exports = router;
