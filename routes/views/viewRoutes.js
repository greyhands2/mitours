/* eslint-disable */
const express = require('express');

const {getOverview, getTour, getLoginForm, getAccount, updateUserData, getMyTours} = require('../../controllers/views/viewsController.js');
const {createBookingCheckout} = require('../../controllers/bookings/bookingsController.js');
const {isLoggedIn, protect} = require('../../controllers/auth/authController.js');
const router = express.Router();

router.get('/', createBookingCheckout, isLoggedIn, getOverview);

router.get('/tour/:slug', isLoggedIn, getTour);

router.get('/login', isLoggedIn, getLoginForm);

router.get('/me', protect, getAccount);

router.get('/my-tours', protect, getMyTours);

router.post('/submit-user-data', protect, updateUserData);









module.exports = router;
