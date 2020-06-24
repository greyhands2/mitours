const express = require('express');

const {getCheckoutSession, createBooking, getBooking, getAllBookings, updateBooking, removeBooking} = require('../../controllers/bookings/bookingsController.js');

const { protect, restrictTo} = require('../../controllers/auth/authController.js');

const router = express.Router();
router.use(protect);
router.get('/checkout-session/:tourID', getCheckoutSession)

router.use(restrictTo('admin', 'lead-guide'));
router.route('/')
.post(createBooking)
.get(getAllBookings);

router.route('/:id')
.get(getBooking)
.patch(updateBooking)
.delete(removeBooking);




module.exports = router;
