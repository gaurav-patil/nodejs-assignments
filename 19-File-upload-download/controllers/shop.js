const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const Product = require('../models/products');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  Product.find().then(products => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
    });
  }).catch(err => console.log(err));
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId).then( product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    }
  ).catch(
    err => {
      console.log(err);
    }
  )
};

exports.getIndex = (req, res, next) => {
  Product.find().then(products => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/'
    });
  }).catch(err => console.log(err));
};

exports.getCart = (req, res, next) => {
  req.user.populate('cart.items.productId')
  .execPopulate()
  .then(user => {
    const products = user.cart.items;
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products,
    });
  })
  .catch((err) => console.log(err));
}

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
  .then(product => {
    req.user.addToCart(product);
    res.redirect('/cart');
  })
  .catch((err) => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({'user.userId': req.user._id})
  .then(orders => {
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders: orders,
    });
  })
  .catch((err) => console.log(err));
};

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout',
  });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.deleteItemFromCart(prodId)
  .then(() => res.redirect('/cart'))
  .catch((err) => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then((user) => {
    const products = user.cart.items.map(i => {
      return {
        quantity: i.quantity,
        product: { ...i.productId._doc }
      }
    })
    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user
      },
      products: products,
    });
    return order.save();
  })
  .then((result) => {
    return req.user.clearCart();
  }).then(() => {
    res.redirect('/orders');
  })
  .catch((err) => console.log(err));
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
  .then(order => {
    if (!order) {
      return next(new Error('No Order Found!'));
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error('Unauthorised'));
    }

    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);
  
    const pdfDoc = new PDFDocument();
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
  
    pdfDoc.fontSize(26).text('Invoice', {
      underline: true,
    });
    pdfDoc.fontSize(16).text('-------------------------------------------');
    let totalPrice = 0;
    order.products.forEach(element => {
      totalPrice += element.quantity * element.product.price;
      pdfDoc.text(element.product.title + '-' + element.quantity + ' x ' + '$' + element.product.price);
    });
    pdfDoc.fontSize(20).text('Total price: $' + totalPrice);
  
    pdfDoc.end();
    // fs.readFile(invoicePath, (err, data) => {
    //   if (err) {
    //     return next(err);
    //   }
    //   res.setHeader('Content-Type', 'application/pdf');
    //   res.setHeader('Content-Disposition', 'inline');
    //   res.send(data);
    // })
    const file = fs.createReadStream(invoicePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    // file.pipe(res);
  })
  .catch((err) => console.log(err));
};