const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');
const ITEMS_PER_PAGE = 2;


// const Product = require('../models/product');
const Product = require('../models/product')
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((totalProduct) => {
      totalItems = totalProduct;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
  .countDocuments()
  .then(totalProduct => {
    totalItems = totalProduct;
    return Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
  })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page <totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)

      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      // const products = user.cart.items;
      // console.log(user.cart.items)
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      // console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};



exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        price = i.quantity * i.productId.price;
        return { quantity: i.quantity, product: { ...i.productId._doc }, price, };
      });

      const totalPrice = products.reduce((prev, curr) => {
        return prev + curr.price;
      }, 0);

      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
        totalPrice: totalPrice
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  const invoiceName = `invoice-${orderId}.pdf`;
  const invoicePath = path.join('data', 'invoices', invoiceName);

  Order.findById(orderId)
    .then(order => {
      if(!order) return next(new Error('No order found!'));

      if(order.user.userId.toString() !== req.user._id.toString()) return next(new Error('Unauthorised user'));


        const pdfDoc = new PDFDocument();
        pdfDoc.pipe(fs.createWriteStream(invoicePath));

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "inline; fileName=" + invoiceName + " "
        );

        pdfDoc.pipe(res);
        pdfDoc.fontSize(25).text('INVOICE', {underline: true});
        pdfDoc.text('------------------------------------');
        
        let totalPrice = 0;
        order.products.forEach(prod => {
          totalPrice += prod.quantity * prod.product.price;
          pdfDoc.fontSize(18).text(
            `${prod.product.title} _____ ${prod.quantity} x $${prod.product.price}`
          );
        });

        pdfDoc.text("------------------------------------");
        pdfDoc.fontSize(25).text(`Total Price: $${totalPrice}`);


        pdfDoc.end();

    })
    .catch(err => next(err))
}