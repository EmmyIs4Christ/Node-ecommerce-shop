const crypto = require("crypto");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();

const bcrypt = require('bcryptjs');

const { validationResult } = require('express-validator')

const User = require('../models/user');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // or 'STARTTLS'
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// const mailOptions = ;

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    console.log(errors.array(), !errors.isEmpty());
    return res.status(422).render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: errors.array()[0].msg,
    oldInput: {
      email,
      password,
      confirmPassword
    },
    validationErrors: errors.array(),
  });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        // req.flash("error", "Invalid email or password.");
        // return res.redirect("/login");
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email or password.",
          oldInput: {
            email,
            password,
            confirmPassword,
          },
          validationErrors: [],
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid email or password.",
            oldInput: {
              email,
              password,
              confirmPassword,
            },
            validationErrors: [],
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;


  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email,
        password,
        confirmPassword,
      },
      validationErrors: errors.array()
    });
  }
  
  User.findOne({ email: email })
    .then((existingEmail) => {
      if (existingEmail) {
        req.flash("error", "Email already exist!");
        return res.redirect("/signup");
      }
      return bcrypt.hash(password, 12).then((hashedPassword) => {
        const user = User({
          email,
          password: hashedPassword,
          cart: { items: [] },
        });
        return user.save();
      });
    })
    .then((response) => {
      // console.log(response);
      if (response) {
        res.redirect("/login");
        transporter
          .sendMail({
            from: process.env.EMAIL_SENDER,
            to: email,
            subject: "Welcome!",
            html: "<h1> Account created successfully </h1>",
            // text: "Hello from Nodemailer!",
          })
          .then(() => {
            console.log("Email sent!");
          })
          .catch((err) => console.log(err));
      }
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  const email = req.body.email;
  crypto.randomBytes(32, (err, buffer) => {

    if(err) {
      console.log(err);
      req.flash('error', 'Please try again')
      return res.redirect('/reset')
    };

    const token = buffer.toString('hex');

    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          req.flash("error", "Email not found, please try a valid email");
          return res.redirect("/reset");
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        // console.log(result)
        if (result) {
          req.flash("success", "CHECK YOUR EMAIL");
          res.redirect("/reset");
          transporter
            .sendMail({
              from: process.env.EMAIL_SENDER,
              to: email,
              subject: "Reset Password",
              html: `
                  <h1>You requested to change your password</h1>
                  <p>Follow this <a href='http://localhost:3000/reset/${token}'>link</a> to continue</p>
             `,
              // text: "Hello from Nodemailer!",
            })
            .then(() => {
              console.log("Email sent!");
            })
            .catch((err) => console.log(err));
        }
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  })
  
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

