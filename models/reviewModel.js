// review/ rating/ createdAt/ ref to tour /ref to user

const mongoose =  require('mongoose');

const Tour = require('./tourModel.js');

const reviewSchema = new mongoose.Schema({

	review: {
		type: String,
		required: [true, 'Review Cannot be Empty'],
		trim: true
	},

	rating: {
		type: Number,
		default: 3.0,
		min: [1, 'A Rating Cannot be Lower than 1'],
		max: [5, 'A Rating Cannot be Higher than 5']
	},

	createdAt: {
		type: Date,
		default: Date.now()


	},

	tour: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'Tour',
			required: [true, 'Review Must Belong to a Tour']
		}

	],

	user: [

		{
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: [true, 'Review Must Be Done by a User']

		}

	]







}, {
	// give room for virtualization when passing the schema
		toJSON: {virtuals: true},
		toObject: {virtuals: true}
});

// define compound index to prevent duplicate reviews
// the extra options of unique set to true ensures that EACH COMBINATION of tour and user are UNIQUE else they would be set to unique independently
reviewSchema.index({tour: 1, user: 1}, {unique: true});



// query middleware to handle our referencing
reviewSchema.pre(/^find/, function(next){
//we are turning off the populate for tour in the reviewSchema because for this application uniquely it is much better for the get one tour controller to show reviews, we are doing this so we do not have too much chains of populate() which can affect performance
	// this.populate({
	// 	path: 'tour',
	// 	select: 'name'
	// }).populate({

	// 	path: 'user',
	// 	select: 'name photo'

	// });


	this.populate({

		path: 'user',
		select: 'name photo'

	});

	next();
})


// using a static method(please note this isnt a static instance like we used in our auth system) to calculate our average ratings from the review schema because of course that's where the ratings originate from and then relay this average to the tour in question
reviewSchema.statics.calcAverageRatings = async function(tourId) {

	// we also use the aggregation pipeline here

	const stats = await this.aggregate([
		{
			$match: {tour: tourId}
		},
		{
			$group: {
				_id: '$tour',
				nRating: {$sum: 1},
				avgRating: {$avg: '$rating'},

			}
		}


		]);
	//update the tour rating fields
	if(stats.length > 0){
		await Tour.findByIdAndUpdate(tourId, {ratingsQuantity: stats[0].nRating, ratingsAverage: stats[0].avgRating});
	} else {
		await Tour.findByIdAndUpdate(tourId, {ratingsQuantity: 0, ratingsAverage: 4.5});
	}

}


// then we call the static method everytime a review doc is saved by a post middleware
// note post middleware doesn't get access to next
reviewSchema.post('save', function(){
	// this points to current review being saved

	this.constructor.calcAverageRatings(this.tour);

});


// we have taken care of calculating and send rating for each tour when a review is created but how about when a review is updated or deleted??

//a delete or update in this sense can be done by either findByIdAndUpdate or findByIdAndDelete
// we then use a pre middleware with regex to cater for thet

reviewSchema.pre(/^findOneAnd/, async function(next){
	// we need access to the doc to get the rating and calculate but since we are in a query middleware, we only have acess to the query , we then however do a normal findOne() query using the query we have access to so we can have access to the doc then work on it

	//we save the retrieved review details to the this object so the post middleware can have access to it
	 this.revw = await this.findOne();

	next();
});


// by
reviewSchema.post(/^findOneAnd/, async function(){

	await this.revw.constructor.calcAverageRatings(this.revw.tour);

})

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
