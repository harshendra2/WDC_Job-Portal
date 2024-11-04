const multer = require("multer");

const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword"
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
