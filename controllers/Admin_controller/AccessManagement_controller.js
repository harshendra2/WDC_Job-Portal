const mongoose=require('mongoose');
const bcrypt = require("bcryptjs");
const admin=require('../../models/adminSchema');
const Joi=require('joi');
const responsibilities=require('../../models/Responsibility_Schema');

const CreateNewRole = Joi.object({
  role_name: Joi.string().min(3).required(),
  confirm_name: Joi.string().min(3).required().valid(Joi.ref('role_name')).messages({
    'any.only': 'Confirm name must match the role name'
  }),
  onboard_company: Joi.boolean().required(),
  onboard_candidate: Joi.boolean().required(),
  subscription_plan: Joi.boolean().required(),
  access_management: Joi.boolean().required(),
  support: Joi.boolean().required()
});

const EditExistingRole=Joi.object({
  onboard_company: Joi.boolean(),
  onboard_candidate: Joi.boolean(),
  subscription_plan: Joi.boolean(),
  access_management: Joi.boolean(),
  support: Joi.boolean()
})

exports.GetAllAdmin=async(req,res)=>{
    try{
      const data = await admin.aggregate([
        {
          $lookup: {
            from: 'responsibilities',
            localField: 'responsibility',
            foreignField: '_id',
            as: 'responsibility'
          }
        },{$project:{tokens:0}},
        {
          $match: {
            responsibility: {
              $elemMatch: { role: { $ne: 'Super Admin' } }
            }
          }
        }
      ]).sort({ createdAt: -1 });
        if(data){
            return res.status(200).send(data);
        }

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.CreateNewRole=async(req,res)=>{
    const {role_name,confirm_name,dashboard,onboard_company,onboard_candidate,subscription_plan,access_management,support,credibility,transaction,user_verification,job_module,terms_condition}=req.body;
  const { error } = CreateNewRole.validate({role_name,confirm_name,onboard_company,onboard_candidate,subscription_plan,access_management,support});
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
    try{
      const existedRole=await responsibilities.findOne({role_name});
      if(existedRole){
        return res.status(400).json({error:"This role is already existed"});
      }
        const data = new responsibilities({
            role:role_name,
            responsibility: {
               dashboard,
                onboard_company,
                onboard_candidate,
                subscription_plan,
                access_management,
                support,
                credibility,
                transaction,
                user_verification,
                job_module,
                terms_condition
              }
          });
      
          const temp = await data.save();
      
          return res.status(201).json({ message: "Role created successfully", data: temp });

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.GetAllRole=async(req,res)=>{
  try{
     const data=await responsibilities.aggregate([{$match:{role:{$ne: 'Super Admin'}}}]);
     if(data){
      return res.status(200).send(data);
     }

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.GetSingleRole=async(req,res)=>{
  const {id}=req.params;
  try{
    const data = await responsibilities.findById(
      id);
      return res.status(200).send(data);
  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.EditRole = async (req, res) => {
  const {id } = req.params;
  const {dashboard,onboard_company,onboard_candidate,subscription_plan,access_management,support,credibility,transaction,user_verification,job_module,terms_condition} = req.body;

  const { error } = EditExistingRole.validate({onboard_company,onboard_candidate,subscription_plan,access_management,support});

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    const data = await responsibilities.findByIdAndUpdate(
     id,
      {
        $set: {
          'responsibility.onboard_company': onboard_company,
          'responsibility.onboard_candidate': onboard_candidate,
          'responsibility.subscription_plan': subscription_plan,
          'responsibility.access_management': access_management,
          'responsibility.support': support,
          'responsibility.dashboard': dashboard,
          'responsibility.credibility': credibility,
          'responsibility.transaction': transaction,
          'responsibility.user_verification':user_verification,
          'responsibility.job_module':job_module,
          'responsibility.terms_condition':terms_condition
        }
      },
      { new: true }
    );
    if (data) {
      return res.status(200).json({ message: "Role updated successfully", data });
    } else {
      return res.status(404).json({ error: "Role not found" });
    }

  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.CreateNewSubAdmin=async(req,res)=>{
  const {roleId}=req.params;
  const {email,password,confirmpassword}=req.body;
  try{
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }
    const existDate=await admin.findOne({email});
    if(existDate){
      return res.status(400).json({error:"This email already existed in our data base"});
    }
    const data = new admin({
      responsibility:roleId,
      email,
     password:password
    });

    const temp = await data.save();
    return res.status(200).json({message:"SubAdmin Created successfully"});

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.AdminBlockingAction = async (req, res) => {
  const { id } = req.params;

  try {
    const adminRecord = await admin.findById(id);

    if (!adminRecord) {
      return res.status(404).json({ error: "Admin not found" });
    }
    const updatedStatus = !adminRecord.status;

    await admin.findByIdAndUpdate(id, { status: updatedStatus });

    return res.status(200).json({ message: "Status updated successfully", status: updatedStatus });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.AccessManagement=async(req,res)=>{
  const {adminId}=req.params;
  try{
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: 'Invalid admin ID' });
  }
  const objectId = new mongoose.Types.ObjectId(adminId);
    const data = await admin.aggregate([
      {$match:{_id:objectId}},
      {
        $lookup: {
          from: 'responsibilities',
          localField: 'responsibility',
          foreignField: '_id',
          as: 'responsibility'
        }
      },{$project:{tokens:0}}
    ]);
      if(data){
          return res.status(200).send(data);
      }

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}
