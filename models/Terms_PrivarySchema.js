const mongoose = require('mongoose');

const TermsPrivacySchema = new mongoose.Schema({
  terms_image: {
    type: String
  },
  privacy_image: {
    type:String
  }
});

module.exports = mongoose.model("TermPrivacy", TermsPrivacySchema);
