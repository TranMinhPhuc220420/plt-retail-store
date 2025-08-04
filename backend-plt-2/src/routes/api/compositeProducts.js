const express = require('express');
const router = express.Router();
const compositeProductController = require('../../controllers/compositeProductController');
const {
  validateCreateComposite,
  validateUpdateComposite,
  validatePrepareComposite,
  validateServeComposite
} = require('../../middlewares/compositeProductValidation');

// GET /api/composite-products - Lấy danh sách sản phẩm composite
router.get('/', compositeProductController.getMyComposites);

// GET /api/composite-products/store/:storeCode - Lấy sản phẩm composite theo store
router.get('/store/:storeCode', compositeProductController.getMyComposites);

// GET /api/composite-products/:id/details - Lấy chi tiết sản phẩm composite để edit
router.get('/:id/details', compositeProductController.getCompositeDetails);

// POST /api/composite-products - Tạo sản phẩm composite mới
router.post('/', validateCreateComposite, compositeProductController.createComposite);

// PUT /api/composite-products/:id - Cập nhật sản phẩm composite
router.put('/:id', validateUpdateComposite, compositeProductController.updateComposite);

// DELETE /api/composite-products/:id - Xóa sản phẩm composite
router.delete('/:id', compositeProductController.deleteComposite);

// POST /api/composite-products/:id/prepare - Chuẩn bị sản phẩm composite (nấu nồi mới)
router.post('/:id/prepare', validatePrepareComposite, compositeProductController.prepareComposite);

// POST /api/composite-products/:id/serve - Phục vụ sản phẩm composite (giảm stock)
router.post('/:id/serve', validateServeComposite, compositeProductController.serveComposite);

// POST /api/composite-products/calculate-price-from-recipe - Tính giá từ công thức
router.post('/calculate-price-from-recipe', compositeProductController.calculatePriceFromRecipe);

module.exports = router;
