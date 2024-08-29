const multer = require('multer');
const path = require('path');

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Images'); // Ensure the 'Images' directory exists
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});

const checkFileType = (file, cb) => {
  // Allowable file extensions
  const fileTypes = /jpeg|jpg|png|gif|svg|webp/;
  // Check the extension name
  const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = fileTypes.test(file.mimetype);
  if (mimeType && extName) {
    return cb(null, true);
  } else {
    cb(new Error('Error: You can only upload images!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
}).fields(
  Array.from({ length: 10 }, (_, index) => ({
    name: `certificates[${index}][image]`,
    maxCount: 1,
  }))
);

module.exports = upload;
