const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

// for embedding we need the userSchema here but for referencing we do not
//const User = require('./userModel.js');


//first we create a basic tour schema
const tourSchema = new mongoose.Schema({
		name: {
			type: String,
			required: [true, 'A Tour must have a Name'],
			unique: true,
			trim: true,
			//for numbers and dates
			maxLength:[40, 'A Tour Name must be less or equal to 40 characters'],
			minLength:[10, 'A Tour Name must not be less than 10 characters'],
			//using the validator plugin import as the validate function
			// validate: [validator.isAlpha, 'The Name Must only contain characters']
		},
		slug: String,

		duration: {
			type: Number,
			required: [true, 'A tour Must Have a Duration']
		},

		maxGroupSize: {
			type: Number,
			required: [true, 'A Tour Must Have a Group Size']
		},

		difficulty: {
			type: String,
			required:[true, 'A Tour Must Have a Difficulty'],
			// only for Strings
			enum: {
				values: ['easy', 'medium', 'difficult'],
				message: 'Difficulty is either: easy, medium or difficult'
			}
		},


		ratingsAverage: {
			type: Number,
			default: 4.5,
			min: [1, 'Rating must be above 1.0'],
			max: [5, 'Rating cannot be greater than 5.0'],
			// this ensures that the returned average to this field is rounded up
			set: (val) => Math.round(val * 10) / 10
		},

		ratingsQuantity: {
			type: Number,
			default: 0
		},

		price: {
			type: Number,
			required: [true, 'A Tour must have a Price']
		},
// do validation to ensure that the discount isnt greater than the price itself..
		priceDiscount: {
			type: Number,
			validate: {
				//  this object in the  validator function would not be visible on an update, only works on a new documnt creation
				validator: function(val){

				return val < this.price;

					},
			message: 'Discount Price ({VALUE}) should be below the regular price'
			}


		},

		summary: {
			type: String,
			trim: true,
			required: [true, 'A Tour Must Have a Summary']
		},

		description: {
			type: String,
			trim: true
		},

		imageCover: {
			type: String,
			required: [true, 'A Tour Must Have a Cover Image']
		},
// the images would contain an array of image link strings
		images: [String],
		createdAt: {
			type: Date,
			default: Date.now(),
			//if we never want to return createdAt field
			select: false
		},

		startDates: [Date],
		// secret tour for vip members only
		secretTour: {
			type: Boolean,
			default: false
		},
		//geospatial data
		startLocation: {
			//GEOjSON
			type: {
				type: String,
				default: 'Point',
				enum: ['Point']
			},
			coordinates: [Number],
			address: String,
			description: String

		},
		locations: [
			{
				type: {
					type: String,
					default: 'Point',
					enum: ['Point']
				},
				coordinates: [Number],
				address: String,
				description: String,
				day: Number
			}
		],
		//assuming we were embedding the user in tour guides, here the user data is automatically stored under the guides when created
		//guides: Array

		//but for referencing the user in tour guides we do it this way..unlike the embedding method only the user id is stored as object id data type on creation, the user data is retrieved during query using "populate()" so it would seem like the user data had been stored in the tours guide all long whereas it was'nt

		// it is however noteworthy that the populate() aforementioned actually generates another query behind the scenes so pending on the amount of usage and the scale of your app it might affect performance
		// so the user data would show
		guides: [

			{
				type: mongoose.Schema.ObjectId,
				// this is where the relationshipreferance beteen the 2 schemas (tours and users in this case) is created
				ref: 'User'

			}

		]

	}, {
		// give room for virtualization when passing the schema
		toJSON: {virtuals: true},
		toObject: {virtuals: true}
	});

 //creating an index for price field as most users would wanna filter by this. using indexes improves read performance

//sorting index in ascending order (1), descending is (-1) as i bet u rightly guessed

//tourSchema.index({price: 1});

// compound index: adding another field that would mostly be queried by users too...ratingsAverage setting to desc order
tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug:1});
// for geospatial queries we have to set an index for the field where we use the geospatial query

tourSchema.index({startLocation: '2dsphere'});



// VIRTUAL properties are used in temporarily storing fields(note not stored or persistent in the database) that can be derived from another for example a duration between start and end date can be converted to weeks virtually stored
// and we notice the idea is kinda similar to a middleware cos each time data is gotten the virtual function runs hence having the .get()


// we used the reqular callback function instead of our favorite arrow function because an arrow function does not get it's own this keyword but a regular function does


tourSchema.virtual('durationWeeks').get(function(){
	// the this keyword here pionts to the current document object
	return this.duration / 7;

})


// since we used parent referencing between tours and reviews , the reviews know about the tours in which they are related with but the tours do not know about the reviews related to them, we have it this way because the reviews have the potential to grow infinitely  and we cannot have all that data in tours so we use a neat solution called "virtual populate"

// but because of the possibility if alot of tours, it would make more sense to add the populate to the get one tour controller

tourSchema.virtual('reviews', {
	ref: 'Review',
	// the foreign field is the name of the relating field in the schema we wanna relate our tourSchema to
	foreignField: 'tour',
	// and locally in tourSchema it is with _id that tourSchema can be referenced in the review model
	localField: '_id'
});


// now we use a mongoose DOCUMENT MIDDLEWARE a middleware that can act on the currently processed document.. we have the pre (happens before an event) and post(happens after an event) middlewares

// pre Document middlweare runs before  only these .save() and .create() commands  and callback has access to the next function
 tourSchema.pre('save', function(next){
 	this.slug = slugify(this.name, {lower: true});
 	next();
 });





// embedding user document in tour guides using provided user id in the query
 // tourSchema.pre('save', async function(next){
 // 	const guidesPromises = this.guides.map(async (id) => await User.findById(id));
 // 	// we have to use promise .all here because each loop in the map of this.guides array returns a promise, making guidesPromises an array full of promises unresolved so to catch all the resolved multiple promises we use a promise.all outside.

 // 	this.guides = await Promise.all(guidesPromises);

 // 	next();
 // })

// post document middleware runs after  only these .save() and .create() remove() validate() commands and callback has access to the doc saved and the next

// tourSchema.post('save', function(docs, next){
//  	console.log(docs);
//  	next();
//  });



//AGGREGATION MIDDLEWARE add hooks before or after our aggregation

// tourSchema.pre('aggregate', function(next){
// 	//filter out the secret tours
// //adding an aggregation stage to the aggregation unlike in the query middleware where we use a new .find() to filter out the secret tour
// 	this.pipeline().unshift( {$match: {secretTour: {$ne: true} }} );
// 	next();
// });


// lets use a query middleware for the populate() function when we use

tourSchema.pre(/^find/, function(next){
	// remember this points to the currently used query
	console.log("hi i am a tour pre query middleware")
	this.populate({
		path: 'guides',
		select:'-__v -passwordChangedAt'
	 });

	next();

});





// next is QUERY MIDDLEWARE which allows us to run a function before or after a query is executed eg .find() update() and the rest of the other query functions

// tourSchema.pre('find', function(next){
	// we pass in a regex for all query functions containing "find" in them eg, findOne, findMany...
tourSchema.pre(/^find/, function(next){
	console.log("hi i am d 1st tour post query middleware")
	//filtering out secret tours
	this.find({secretTour: {$ne: true}});

	this.start = Date.now();

	next();

});



tourSchema.post(/^find/, function(docs) {
	console.log("hi i am d 2nd tour post query middleware")
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);

});









// now next we create a model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
