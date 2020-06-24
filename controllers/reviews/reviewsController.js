const Review = require('../../models/reviewModel.js');
const factory = require('../factory/handlerFactory.js');









exports.setNestedTourUserIds = (req, res, next) => {
	//middleware
	/*** this block of code is here to give room for possibility of a nested routes implementation ***/
	if(!req.body.tour) {
		req.body.tour=req.params.tourId;

	}
	//req.user here is gotten from the protect middleware
	if(!req.body.user) {
		req.body.user=req.user.id;

	}
	/******                     *****/



	next();
}



exports.getReviews = factory.getAll(Review);


exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);



exports.deleteReview = factory.deleteOne(Review);




exports.editReview = factory.updateOne(Review);
