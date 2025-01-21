const path = require('path');
const { body } = require('express-validator')

const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  isAuth,
  [
    body("title", "Please enter a valid Title with a minimum of 3 characters")
      .isString()
      .isLength({ min: 3 }),
    body("image", 'Please enter a valid Image'),
    body("price", 'Please enter a valid number with decimals').isFloat(),
    body("description", 'Please enter a valid description of min of 5, max of 200 characters').isLength({min: 5, max: 200}),
  ],
  adminController.postAddProduct
);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  isAuth,
  [
    body("title", "Please enter a valid Title with a minimum of 3 characters")
      .isString()
      .isLength({ min: 3 }),
    // body("imageUrl", "Please enter a valid URL").isURL(),
    body("price", "Please enter a valid number with decimals").isFloat(),
    body(
      "description",
      "Please enter a valid description of min of 5, max of 200 characters"
    ).isLength({ min: 5, max: 200 }),
  ],
  adminController.postEditProduct
);

router.delete('/products/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
