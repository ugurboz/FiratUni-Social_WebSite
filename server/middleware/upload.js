const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("./s3"); // S3 istemcisi
require("dotenv").config();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const fileName = Date.now().toString() + "-" + file.originalname;
      cb(null, fileName);
    },
  }),
});

module.exports = upload;