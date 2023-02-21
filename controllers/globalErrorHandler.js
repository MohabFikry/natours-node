const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `invalid${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateNameDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Dupicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => `(${el.message})`);
  const message = `Invalid inputs!  ${errors.join('.  ')}`;
  return new AppError(message, 400);
};

const handleJWTTokenError = () => new AppError('Token Error!', 401);
const handleJWTTokenExpire = () => new AppError('Token expired!', 401);

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      error: err,
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
    //Rendered Website
  }
  return res.status(err.statusCode).render('error', {
    title: ' Somethong went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    console.error('error', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: ' Somethong went wrong!',
      msg: err.message,
    });
  }
  console.error('error', err);
  return res.status(err.statusCode).render('error', {
    title: ' Somethong went wrong!',
    msg: 'Please try again later!',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateNameDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTTokenError();
    if (error.name === 'TokenExpiredError') error = handleJWTTokenExpire();
    sendErrorProd(error, req, res);
  }
};
