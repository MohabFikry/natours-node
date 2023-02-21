/* eslint-disable prefer-arrow-callback */
const { promisify } = require('util');

const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const User = require('../models/userModel');

const AppError = require('../utils/appError');

const catchAsync = require('../utils/catchAsync');

const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(
    req.body
    //   {
    //   name: req.body.name,
    //   email: req.body.email,
    //   password: req.body.password,
    //   passwordConfirm: req.body.passwordConfirm,
    //   role: req.body.role,
    // }
  );

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  //Check inputs
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please enter email and password!', 400));
  }
  //identification + authentication
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('email or password is invalid!', 401));
  }
  //create Token
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  //If Token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError("You're not logged in. Please login to have access!", 401)
    );
  }
  // Token Verification - Payload
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //User exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('User deleted!', 401));
  }
  //Password not changed
  if (await currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Passwoed changed! Please login again.', 402));
  }
  // Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // Token Verification - Payload
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      //User exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //Password not changed
      if (await currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // Grant access to protected route
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictedTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authoeized to do this action!', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async function (req, res, next) {
  // get user from mail
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('User not found!', 404));
  }
  // generate random reset token
  const resetToken = await user.createPasswordResetToken();
  //validateBeforeSave to recieve mail only
  await user.save({ validateBeforeSave: false });
  //send mail with token
  try {
    const resetURL = `${req.protocol}//:${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'mail sent to reset your PASS',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Sending Failed! please try again!', 500));
  }
});

//
exports.resetPassword = catchAsync(async function (req, res, next) {
  //compare recieved token with saved token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() },
  });

  //check if user exists and token not expired
  if (!user) {
    return next(new AppError('Token not found!', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;

  await user.save();
  // update changedPasswordAt
  // sign in

  //create Token
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});
