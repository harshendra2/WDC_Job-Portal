const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Admin_controller/AccessManagement_controller');

router.get('/admin/getall_admin',controller.GetAllAdmin);   //fetching table data
router.post('/admin/create_role',controller.CreateNewRole);   // Create new Role
router.get('/admin/getall_role',controller.GetAllRole);   //Get role
router.put('/admin/edit_role/:id',controller.EditRole);   //Edit role, add new responsibilty
router.post('/admin/subadmin/:roleId',controller.CreateNewSubAdmin);   //Add new User
router.put('/admin/admin_action/:id',controller.AdminBlockingAction);   //Change Action

//Access Management 
router.get('/admin/login/:adminId',controller.AccessManagement);

module.exports=router;