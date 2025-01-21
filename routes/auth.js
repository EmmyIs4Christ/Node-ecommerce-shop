const express = require('express');
// const { check } = require('express-validator/check')
const { check, body } = require('express-validator')

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please enter a valid Email.").normalizeEmail(),
    check(
      "password",
      "Please enter a valid Password with only numbers an text longer than 3 characters"
    )
    .isLength({min: 3})
    .isAlphanumeric()
    .trim(),
  ],
  authController.postLogin
);

router.post(
  "/signup",
  [
    body(
    "password",
    "Please enter a valid Password with only numbers an text longer than 3 characters"
  )
    .isAlphanumeric()
    .isLength({ min: 3 })
    .trim(),

  check("email").isEmail().withMessage("Please enter a valid Email.").normalizeEmail(),

  body('confirmPassword').trim().custom((value, {req}) => {
    if(value !== req.body.password) {
        throw new Error('Password have to match!')
    };
    return true;
  })
],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
