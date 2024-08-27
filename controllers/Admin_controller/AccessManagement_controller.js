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
  onboard_company: Joi.boolean().required(),
  onboard_candidate: Joi.boolean().required(),
  subscription_plan: Joi.boolean().required(),
  access_management: Joi.boolean().required(),
  support: Joi.boolean().required()
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
        },{$project:{tokens:0}}
      ]);
        if(data){
            return res.status(200).send(data);
        }

    }catch(error){
        return res.status(500).json({error:"Internal server error"});
    }
}

exports.CreateNewRole=async(req,res)=>{
    const {role_name,confirm_name,onboard_company,onboard_candidate,subscription_plan,access_management,support}=req.body;
  
  const { error } = CreateNewRole.validate({role_name,confirm_name,onboard_company,onboard_candidate,subscription_plan,access_management,support});
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
    try{
        const data = new responsibilities({
            role:role_name,
            responsibility: {
                onboard_company,
                onboard_candidate,
                subscription_plan,
                access_management,
                support,
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
     const data=await responsibilities.aggregate([{$project:{responsibility:0}}]);
     if(data){
      return res.status(200).send(data);
     }

  }catch(error){
    return res.status(500).json({error:"Internal server error"});
  }
}

exports.EditRole = async (req, res) => {
  const {id } = req.params;
  const {onboard_company,onboard_candidate,subscription_plan,access_management,support} = req.body;

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
    const hashedPassword = await bcrypt.hash(password, 12);
    const data = new admin({
      responsibility:roleId,
      email,
     password:hashedPassword
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
