const express = require('express');
const {getAllTours, addTour, getTour, editTour, removeTour, aliasTopTours, getTourStats, getMonthlyPlan, getToursWithin, getDistances, uploadTourImages, resizeTourImages} = require('../../controllers/tours/toursController.js');

const {protect, restrictTo} = require('../../controllers/auth/authController.js');

// implementing a nested route
// const {createReview} = require('../../controllers/reviews/reviewsController.js');


//implementing nested routes between tours and reviews where we can see clearly that reviews is a child of tours

//POST /tour/232s23as/reviews
//GET /tour/232s23as/reviews
//GET /tour/232s23as/reviews/9829348ew823

// router.route('/:tourId/reviews')
// .post(protect, restrictTo('user'), createReview);

// a better and more advanced way of implementing a nested route with express
const reviewRouter = require('../../routes/reviews/reviewRoutes.js');






const router = express.Router();
//nested endpoint
router.use('/:tourId/reviews', reviewRouter);
//adding a params middleware
//router.param('id', checkIDMiddleware);




//here we now call the root of router
//mount the router



//alias route implemented with middleware
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

//aggregation route
router.route('/tour-stats').get(getTourStats);
//monthly plan route
router.route('/monthly-plan/:year').get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

//geospatial search routes

//searching for tours within a specified radius

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
.get(getToursWithin);

// searching for how close a user's specified location is to all the tour locations
router.route('/distances/:latlng/unit/:unit')
.get(getDistances);






//routes for "/" tours root
router.route('/')
.get(getAllTours)
.post(protect, restrictTo('admin', 'lead-guide'), addTour);
// .post(checkBody, addTour);

// root routes that pass an id
router.route('/:uniqShii')
.get(getTour)
.patch(protect, restrictTo('admin', 'lead-guide'), uploadTourImages, resizeTourImages, editTour)
.delete(protect, restrictTo('admin', 'lead-guide'),removeTour);





module.exports = router;
