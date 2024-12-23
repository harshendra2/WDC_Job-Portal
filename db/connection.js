const mongoose = require("mongoose");

// MongoDB connection URL
//const URL = "mongodb://jobdata:jobdata%40123@65.20.91.47:27017/test?authSource=test&directConnection=true&serverSelectionTimeoutMS=5000&appName=mongosh+2.3.7";
const URL="mongodb://jobdata:jobdata%40123@65.20.91.47:27017/?authSource=admin"
// Connect to MongoDB
mongoose
  .connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected"))
  .catch((error) => {
    console.error("Database connection error:", error);
  });