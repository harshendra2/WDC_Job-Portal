const express = require("express");
const router = new express.Router();
const controller = require("../../controllers/Admin_controller/CredibilityEstablishment_controller");

router.get("/admin/credibilty/establishment", controller.CredibilityEstablishment);

module.exports=router;