const express = require('express');
const multer = require('multer');
const imageController = require('../../controllers/imageController');

const router = express.Router();

const uploadEmployeeAvatar = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'storage/employees/avatars');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1000000000);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
}).any();

// group employees routes
router.post('/', uploadEmployeeAvatar, imageController.uploadAvatarEmployee);

// export default router;
module.exports = router;