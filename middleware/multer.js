const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Images"); // Ensure this directory exists or create it before using
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword", // DOC
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type."));
  }
};

const maxSize = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxSize,
  },
});

module.exports = {
  upload
};



