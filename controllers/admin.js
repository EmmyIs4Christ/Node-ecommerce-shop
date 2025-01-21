const { validationResult } = require('express-validator');

const mongoose = require('mongoose');

const Product = require('../models/product');
const fileFns = require('../util/file');

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    errorMessage: null,
    hasError: false,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  // console.log('from image', req.file, image)
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      errorMessage: 'Attached file is not an image',
      hasError: true,
      product: {
        title,
        price,
        description,
      },
      validationErrors: [],
    });
  };

const errors = validationResult(req);
if(!errors.isEmpty()) {
  return res.status(422).render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    errorMessage: errors.array()[0].msg,
    hasError: true,
    product: {
      title,
      price,
      description,
      // imageUrl,
    },
    validationErrors: errors.array()
  });
};

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: image.path,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err, 'from post add product');
      // res.redirect('/500')
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }

      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        errorMessage: null,
        hasError: false,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImage = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      errorMessage: errors.array()[0].msg,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if(updatedImage) {
        fileFns.deleteFile(product.imageUrl)
        product.imageUrl = updatedImage.path;
      } 
      
      return product.save().then((result) => {
        console.log("UPDATED PRODUCT!");
        res.redirect("/admin/products");
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then((products) => {
      // console.log(products);
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId).then(product => {
    fileFns.deleteFile(product.imageUrl);
    return Product.deleteOne({ _id: prodId, userId: req.user._id })
  })
    .then(() => {
      console.log("DESTROYED PRODUCT");
      // res.redirect("/admin/products");
      res.status(200).json({
        message: 'Done'
      })
    })
    .catch((err) => {
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // return next(error);
      res.status(500).json({
        message: 'Deleting product failed'
      })
    });
};
