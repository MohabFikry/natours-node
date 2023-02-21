const express = require('express');

const tourController = require('../controllers/tourController');

const authController = require('../controllers/authController');

const reviewRouter = require('./reviewRoute');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

// router.param('id', tourController.checkID);
router
  .route('/best-5-tours')
  .get(tourController.getAliasBest, tourController.getAllTours);

router.route('/tour-stats').get(tourController.tourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictedTo('admin', 'lead-tour', 'guide'),
    tourController.monthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    tourController.createTour
  );
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictedTo('admin', 'lead-tour'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictedTo('admin', 'lead-tour'),
    tourController.deleteTour
  );

module.exports = router;
