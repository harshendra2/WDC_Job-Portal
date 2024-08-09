require('dotenv').config();
module.exports = {
  email: {
    user: process.env.emailUser,
    pass: process.env.emailPassword,
  }
};