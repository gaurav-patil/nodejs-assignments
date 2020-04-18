const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        const error = new Error('Validation failed. Please enter correct data');
        error.statusCode = 422;
        error.data = err.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    bcrypt.hash(password, 12)
    .then((hashedPassword) => {
      const newUser = new User({
        email: email,
        password: hashedPassword,
        name: name,
      });
      return newUser.save();
    })
    .then(result => {
        res.status(201).json({
            message: 'User created successfully!',
            userId: result._id,
        });
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
}

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                const error = new Error('A user with this email address could not be found!');
                error.statusCode = 410;
                throw error;
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password...');
                error.statusCode = 410;
                throw error; 
            }
            const token = jwt.sign({
                email: loadedUser.email,
                userId: loadedUser._id.toString(),
            }, 'secretkey', {
                expiresIn: '1h',
            });
            res.status(200).json({
                token: token,
                userId: loadedUser._id.toString(),
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}