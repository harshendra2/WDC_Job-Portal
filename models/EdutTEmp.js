const mongoose = require('mongoose');

const candidates_edu_skills = new mongoose.Schema({
  
education: {
    type: String,
    required: true
  },
}, { collection: 'candidates_edu_skills' });

module.exports = mongoose.model("candidate_edu", candidates_edu_skills);
