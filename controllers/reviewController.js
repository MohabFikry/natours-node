const Review = require('../models/reviewModel');

const factory = require('./handlerFactory');

exports.setTourUserIds = async (req, res, next) => {
  //get user from logged in user and Tour ID from params
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  // bad Performance use index
  // if (await Review.findOne({ tour: req.body.tour, user: req.body.user })) {
  //   return next(
  //     new AppError('You already posted a review you can update it', 400)
  //   );
  // }
  next();
};

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);
