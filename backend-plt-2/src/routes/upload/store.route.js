import express from 'express';
import multer from 'multer';

import imageController from '../../controllers/imageController.js';

const router = express.Router();

const uploadStoreAvatar = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'storage/stores/avatars');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1000000000);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, //  // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
}).any();

// group my-store routes
router.post('/', uploadStoreAvatar, imageController.updateAvatarMyStore);

export default router;
