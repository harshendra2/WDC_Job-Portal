const { required } = require('joi');
const mongoose = require('mongoose');

const SubscriptionPlane=new mongoose.Schema({
plane_name:{
    type:String,
    require:true
},
price:{
    type:Number,
    required:true
},
search_limit:{
    type:Number,
    required:true
},
available_candidate:{
    type:String,
    required:true
},
user_access:{
    type:Number,
    required:true
},
cv_view_limit:{
    type:Number,
    required:true
},



})