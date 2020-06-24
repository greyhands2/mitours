const APIFeatures = require('../../utils/APIFeatures.js');

const catchAsync = require('../../utils/catchAsync.js');
const AppError = require('../../utils/appError.js');

// we use factory functions here..they are functions that return other functions
exports.deleteOne = (Model)=> catchAsync(async (req, res, next)=> {

		 const doc = await Model.findByIdAndDelete(req.params.uniqShii);

		 if(!doc){
			return next(new AppError('No Document found with that ID', 404));
		}

		res.status(200)
		.json({
			status: "success",
			message: "deleted"
		})

});


// note this return method here is the same as deleteOne just different makeup
exports.updateOne = (Model) => {

	return catchAsync(async (req, res, next)=> {


		const doc = await Model.findByIdAndUpdate(req.params.uniqShii, req.body, {
			new: true,
			runValidators: true
		});

		if(!doc){
			return next(new AppError('No Document found with that ID', 404));
		}

		res.status(200)
		.json({
			status: "success",
			data: {
				data: doc
			}
		})

});

}



exports.createOne = Model => catchAsync(async (req, res, next)=> {
const doc = await Model.create(req.body);

res.status(201)
.json({
	status: "success",
	data: {
		data: doc
	}
});

//another way of saving to mongodb
// const newTour = new Tour({});
// newTour.save();


});




exports.getOne = (Model, populateOptions=false) => catchAsync(async (req, res, next)=> {

// with respect to the referencing of user in the tour guides schema we implemented, during this query we use the populate() to fetch the user info using the object id data type it was saved in when created in the tours schema and then send data to the client side. notice we also removed some fields in the user data from our query

// however for good coding pratice sake we are gonna push the populate() function to the tours schema and use a query middleware instead
	// 	const tour = await Tour.findById(req.params.uniqShii).populate({path: 'guides',
	// 		select:'- __v -passwordChangedAt'
	// });


let query = Model.findById(req.params.uniqShii);
if(populateOptions) query = query.populate(populateOptions);

const doc = await query;
		// or Tour.findOne({_id: req.params.id})

		if(!doc){
			return next(new AppError('No Document found with that ID', 404));
		}



		res.status(200)
		.json({
			status: "success",
			data: {
				data: doc
			}
		});



});


exports.getAll = (Model) =>  {


 return catchAsync(async (req, res, next) => {

	/****         ******/
	// giving room for nested routes in our get all tours controller
	let filter = {};
	if(req.params.tourId) filter = {tour: req.params.tourId};
	/******       *****/

	//


 const features = new APIFeatures(Model.find(filter), req.query).filterer().sorter().fieldLimiter().paginator();

// execute query

//explain() when attached to a query returns statistics about the query like executionStats that would show no.s of docs scanned and no.s of results..we could use this to track the effectiveness of the indexes we create
	// const docs = await features.queryModel.explain();

	const docs = await features.queryModel;

// send response
	res.status(200).json({
		status: 'success',
		results: docs.length,
		data: {
		 data: docs
		},

	})




});

}
