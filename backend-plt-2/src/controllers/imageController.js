const Image = require('../models/Image'); // Adjust the path as necessary

const path = require('path');
// const { join, dirname } = path;
// const { fileURLToPath } = require('url');
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

const imageController = {
  updateAvatarMyStore: async (req, res) => {
    try {
      if (req.files.length <= 0) {
        return res.status(400).json({ error: 'image_field_is_required' });
      }

      const file = req.files[0];
      if (!file) {
        return res.status(400).json({ error: 'image_file_is_required' });
      }

      const fileName = file.filename;
      if (!fileName) {
        return res.status(400).json({ error: 'filename_is_required' });
      }
      
      const mimeType = file.mimetype || 'image/jpeg'; // Default to jpeg if not provided
      const fileSize = file.size || 0; // Default to 0 if not provided

      const baseUrl = process.env.BASE_URL;
      const imageUrl = `${baseUrl}/p/stores/${fileName}`;
      const realImageUrl = `${baseUrl}/${imageUrl}`;

      const image = new Image({
        url: imageUrl,
        real_url: realImageUrl,
        filename: fileName,
        mimetype: mimeType,
        size: fileSize,
        altText: `avatar for store`,
        role: 'storeAvatar',
        uploadedBy: req.user._id, // Assuming req.user is set by verifyJWT middleware
      });
      await image.save();

      res.status(200).json({
        url: image.url,
        filename: image.filename,
        mimetype: image.mimetype,
        size: image.size,
        role: image.role,
        uploadedBy: image.uploadedBy,
        uploadedAt: image.uploadedAt,
      });

    } catch (error) {
      
      res.status(500).json({ error: 'failed_to_update_store_avatar' });
    }
  },

  sendAvatarMyStore: async (req, res) => {
    try {
      const { filename } = req.params;
      if (!filename) {
        return res.status(400).json({ error: 'filename_is_required' });
      }

      const image = await Image.findOne({ filename, role: 'storeAvatar' });
      if (!image) {
        return res.status(404).json({ error: 'image_not_found' });
      }

      const filePath = path.join(__dirname, '../../storage/stores/avatars', filename);

      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=604800');
      res.setHeader('Content-Type', image.mimetype);
      res.setHeader('Content-Length', image.size);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      res.sendFile(filePath);
      // res.status(200);
    } catch (error) {
      console.error('Error sending store avatar:', error);
      res.status(500).json({ error: 'failed_to_send_store_avatar' });
    }
  }
};

module.exports = imageController;
