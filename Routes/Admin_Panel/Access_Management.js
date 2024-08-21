const express=require('express');
const router=new express.Router();
const controller=require('../../controllers/Admin_controller/AccessManagement_controller');

router.get('/admin/getall_admin',controller.GetAllAdmin);
router.post('/admin.create_role',controller.CreateNewRole);
router.get('/admin/getall_role',controller.GetAllRole);
router.put('/admin/edit_role/:id',controller.EditRole);
router.post('/admin/createuser/:roleId',controller.CreateNewSubAdmin);
router.put('/admin/admin_action/:id',controller.AdminBlockingAction);

module.exports=router;