const path = require('path');

const express = require('express');

const rateLimit = require('express-rate-limit');

const helmet = require('helmet');

const mongoSantize = require('express-mongo-sanitize');

const xss = require('xss-clean');

const hpp = require('hpp');

const morgan = require('morgan');

const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');

const globalErrorHandler = require('./controllers/globalErrorHandler');

const app = express();

//set HTTP headers
app.use(helmet());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
//serving static file
app.use(express.static(path.join(__dirname, 'public')));
//limit number of requests
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message:
    'Maximum allowed numer of requests per hour consumed! Try again in an hour.',
});

app.use('/api', limiter);

const tourRouter = require('./routes/tourRoute');
const userRouter = require('./routes/userRoute');
const reviewRouter = require('./routes/reviewRoute');
const viewRoute = require('./routes/viewRoute');
const bookingRouter = require('./routes/bookingRoute');

//Body parser,, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
//parsing data coming from form
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NOSQL query injection
app.use(mongoSantize());
//Data sanitization against XSS
app.use(xss());
//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAvergae',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/', viewRoute);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
