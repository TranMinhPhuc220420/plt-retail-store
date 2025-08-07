const Image = require('../models/Image');
const path = require('path');

const imageController = {
  async uploadAvatarMyStore(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'image_field_is_required' });
      }

      const file = req.files[0];
      if (!file?.filename) {
        return res.status(400).json({ error: 'filename_is_required' });
      }

      const { filename, mimetype = 'image/jpeg', size = 0 } = file;
      const baseUrl = process.env.BASE_URL;
      const imageUrl = `${baseUrl}/p/stores/${filename}`;
      const realImageUrl = `${baseUrl}/${imageUrl}`;

      const image = new Image({
        url: imageUrl,
        real_url: realImageUrl,
        filename,
        mimetype,
        size,
        altText: 'avatar for store',
        role: 'storeAvatar',
        uploadedBy: req.user._id,
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
    } catch {
      res.status(500).json({ error: 'failed_to_update_store_avatar' });
    }
  },

  async sendAvatarMyStore(req, res) {
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

      res.set({
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=604800',
        'Content-Type': image.mimetype,
        'Content-Length': image.size,
        'Content-Disposition': `inline; filename="${filename}"`,
      });

      res.sendFile(filePath);
    } catch (error) {
      console.error('Error sending store avatar:', error);
      res.status(500).json({ error: 'failed_to_send_store_avatar' });
    }
  },

  async uploadAvatarMyProduct(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'image_field_is_required' });
      }

      const file = req.files[0];
      if (!file?.filename) {
        return res.status(400).json({ error: 'filename_is_required' });
      }

      const { filename, mimetype = 'image/jpeg', size = 0 } = file;
      const baseUrl = process.env.BASE_URL;
      const imageUrl = `${baseUrl}/p/products/${filename}`;
      const realImageUrl = `${baseUrl}/${imageUrl}`;

      const image = new Image({
        url: imageUrl,
        real_url: realImageUrl,
        filename,
        mimetype,
        size,
        altText: 'avatar for product',
        role: 'productImage',
        uploadedBy: req.user._id,
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
      console.error('Error uploading product avatar:', error);
      res.status(500).json({ error: 'failed_to_update_product_avatar' });
    }
  },

  async sendAvatarMyProduct(req, res) {
    try {
      const { filename } = req.params;
      if (!filename) {
        return res.status(400).json({ error: 'filename_is_required' });
      }

      const image = await Image.findOne({ filename, role: 'productImage' });
      if (!image) {
        return res.status(404).json({ error: 'image_not_found' });
      }

      const filePath = path.join(__dirname, '../../storage/products/avatars', filename);

      res.set({
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=604800',
        'Content-Type': image.mimetype,
        'Content-Length': image.size,
        'Content-Disposition': `inline; filename="${filename}"`,
      });

      res.sendFile(filePath);
    } catch (error) {
      console.error('Error sending product avatar:', error);
      res.status(500).json({ error: 'failed_to_send_product_avatar' });
    }
  },

  async uploadAvatarEmployee(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'image_field_is_required' });
      }

      const file = req.files[0];
      if (!file?.filename) {
        return res.status(400).json({ error: 'filename_is_required' });
      }

      const { filename, mimetype = 'image/jpeg', size = 0 } = file;
      const baseUrl = process.env.BASE_URL;
      const imageUrl = `${baseUrl}/p/employees/${filename}`;
      const realImageUrl = `${baseUrl}/${imageUrl}`;

      const image = new Image({
        url: imageUrl,
        real_url: realImageUrl,
        filename,
        mimetype,
        size,
        altText: 'avatar for employee',
        role: 'employeeAvatar',
        uploadedBy: req.user._id,
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
      console.error('Error uploading employee avatar:', error);
      res.status(500).json({ error: 'failed_to_update_employee_avatar' });
    }
  },

  async sendAvatarEmployee(req, res) {
    try {
      const { filename } = req.params;
      if (!filename) {
        return res.status(400).json({ error: 'filename_is_required' });
      }

      const image = await Image.findOne({ filename, role: 'employeeAvatar' });
      if (!image) {
        return res.status(404).json({ error: 'image_not_found' });
      }

      const filePath = path.join(__dirname, '../../storage/employees/avatars', filename);

      res.set({
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=604800',
        'Content-Type': image.mimetype,
        'Content-Length': image.size,
        'Content-Disposition': `inline; filename="${filename}"`,
      });

      res.sendFile(filePath);
    } catch (error) {
      console.error('Error sending employee avatar:', error);
      res.status(500).json({ error: 'failed_to_send_employee_avatar' });
    }
  },
};

module.exports = imageController;
