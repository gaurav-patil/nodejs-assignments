const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

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
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
    },
    validationErrors: [],

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
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationErrors: [],
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }
  bcrypt.hash(password, 12)
  .then((hashedPassword) => {
    const newUser = new User({
      email: email,
      password: hashedPassword,
      cart: { items: [] }
    });
    return newUser.save();
  })
  .then(() => {
    res.redirect('/login');
    return transporter.sendMail({
      to: email,
      from: 'www.gauravpatil@yahoo.com',
      subject: 'Congratulations! Successfully signed up ...',
      html: '<p>You successfully signed up !</p>',
    })
  })
  .catch(err => console.log(err));
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }
  User.findOne({email: email})
  .then(user => {
    if (!user) {
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: 'Invalid Email or password',
        oldInput: {
          email: email,
          password: password,
        },
        validationErrors: []
      });
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
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: 'Invalid Email or password',
        oldInput: {
          email: email,
          password: password,
        },
        validationErrors: []
      });
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

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (error, buffer) => {
    if (error) {
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email})
    .then(user => {
      if (!user) {
        req.flash('error', 'No account with that email found!');
        return res.redirect('/reset');
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      return user.save();
    })
    .then(result => {
      res.redirect('/');
      transporter.sendMail({
        to: req.body.email,
        from: 'www.gauravpatil@yahoo.com',
        subject: 'Password Reset ...',
        html: `
          <p>
            You requested a password reset.
          </p>
          <p>Click this: <a href="http://localhost:3000/reset/${token}">link</a></p>
        `
      });
    })
    .catch(err => console.log(err));
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  let resetUser;
  User.findOne({ resetToken: token, resetTokenExpiration: {
    $gt: Date.now()
  }})
  .then(user => {
    let message = req.flash('error');
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }
    res.render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'New Password',
      errorMessage: message,
      userId: user._id.toString(),
      passwordToken: token,
    }); 
  })
  .catch(err => console.log(err));
}

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  User.findOne({ resetToken: passwordToken, resetTokenExpiration : {$gt: Date.now()}, _id: userId})
  .then(user => {
    resetUser = user;
    return bcrypt.hash(newPassword, 12);
  })
  .then(hashedPassword => {
    resetUser.password = hashedPassword;
    resetUser.resetToken = null;
    resetUser.resetTokenExpiration = undefined
    return resetUser.save();
  })
  .then(result => {
    res.redirect('/login');
  })
  .catch(err => console.log(err));
}