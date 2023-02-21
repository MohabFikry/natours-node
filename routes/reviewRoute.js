const express = require('express');

const router = express.Router({ mergeParams: true });

const authController = require('../controllers/authController');

const reviewController = require('../controllers/reviewController');

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictedTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictedTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictedTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
