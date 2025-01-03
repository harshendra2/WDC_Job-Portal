const { required } = require('joi');
const mongoose = require('mongoose');

const ResponsibilitySchema = new mongoose.Schema({
    role:{
        type:String,
        required:true,
      },
      responsibility:{
        onboard_company: {
          type: Boolean,
          default: false
        },
        onboard_candidate: {
          type: Boolean,
          default: false
        },
        subscription_plan: {
          type: Boolean,
          default: false
        },
        access_management: {
          type: Boolean,
          default: false
        },
        support: {
          type: Boolean,
          default: false
        },
        dashboard:{
          type: Boolean,
          default: false
        },
        credibility:{
          type: Boolean,
          default: false
        },
        transaction: {
          type: Boolean,
          default: false
        },
        user_verification:{
          type: Boolean,
          default: false
        },
        job_module:{
          type: Boolean,
          default: false
        },
        terms_condition:{
          type:Boolean,
          default:false
        }

      },
});

module.exports = mongoose.model("responsibilities", ResponsibilitySchema);
