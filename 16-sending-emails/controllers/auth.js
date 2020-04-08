const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: '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',
  }
}));

exports.getLogin = (req, res, next) => {
  // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1] === 'true';
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  User.findOne({email: email})
  .then((user) => {
    if (user) {
      req.flash('error', 'Email exists already, please use a different one');
      return res.redirect('/signup');
    }
    return bcrypt.hash(password, 12)
    .then((hashedPassword) => {
      const newUser = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] }
      });
      return newUser.save();
    });
  })
  .then(() => {
    res.redirect('/login');
    return transporter.sendMail({
      to: email,
      from: 'www.gauravpatil@yahoo.com',
      subject: 'Congratulations! Successfully signed up ...',
      html: '<html>You successfully signed up !</html>',
    })
  })
  .catch(err => console.log(err));
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({email: email})
  .then(user => {
    if (!user) {
      req.flash('error', 'Invalid Email or password');
      return res.redirect('/login');
    }
    bcrypt.compare(password, user.password)
    .then(doMatch => {
      if (doMatch) {
        req.session.isLoggedIn = true;
        req.session.user = user;
        return req.session.save(() => {
          res.redirect('/');
        });
      }
      req.flash('error', 'Invalid Email or password');
      res.redirect('/login');
    })
    .catch(err => console.log(err));
  })
    .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};
