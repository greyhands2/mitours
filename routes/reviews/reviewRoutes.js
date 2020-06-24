const express = require('express');

const {getReviews, createReview, setNestedTourUserIds, getReview, deleteReview, editReview} = require('../../controllers/reviews/reviewsController.js');

const { protect, restrictTo} = require('../../controllers/auth/authController.js');

// setting mergeParams to true enables access to another router's id for nested rutes
const router = express.Router({mergeParams: true});

router.use(protect);



router.route('/')
.get(getReviews)
.post(restrictTo('user'), setNestedTourUserIds, createReview);



router.route('/:uniqShii')
.get(getReview)
.patch(restrictTo('user', 'admin'), editReview)
.delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router;
