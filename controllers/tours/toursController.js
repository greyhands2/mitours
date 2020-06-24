
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../../dev-data/data/tours-simple.json`));

const Tour = require('../../models/tourModel.js');


const catchAsync = require('../../utils/catchAsync.js');
const AppError = require('../../utils/appError.js');

const factory = require('../factory/handlerFactory.js');
//declaration of params middleware
// const checkIDMiddleware = (req, res, next, val) => {
// 	req.params.id = req.params.id*1
// 	id = val*1;
// 	//us vanilla fnction find() to search in an array
// 	if(id > tours.length){
// 		// the return here is compulsory else the program keeps running
// 	 return res.status(404).json({status: 'failed',
// 		 data: null
// 		});
// 	}
// 	console.log('performed id validation middleware');
// 	next();
// }



// const checkBody = (req, res, next) => {
// 	console.log(req.body)
// 	if(Array.isArray(req.body) || !req.body.hasOwnProperty('name') || !req.body.hasOwnProperty('price')) {
// 		return res.status(400).json({
// 			status: "failed",
// 			message: "invalid request"
// 		});
// 	}
// 	next();
// }
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
	if(file.mimetype.startsWith('image')){
		cb(null, true)
	} else {
		cb(new AppError('Not an Image!! Please Upload Only Images', 400), false);
	}
}


const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter
});

//uploading multiple file fields
exports.uploadTourImages = upload.fields([
	{name: 'imageCover', maxCount:1},
	{name: 'images', maxCount: 3}
]);


exports.resizeTourImages = catchAsync( async (req, res, next) => {
	if(!req.files.imageCover || !req.files.images) return next();

	//1) cover image
	req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
	await sharp(req.files.imageCover[0].buffer)
	.resize(2000, 1333)
	.toFormat('jpeg')
	.jpeg({quality: 90})
	.toFile(`public/img/tours/${req.body.imageCover}`);

	//Images
	req.body.images = new Array();

	await Promise.all(req.files.images.map( async (file, ind)=>{
		const filename = `tour-${req.params.id}-${Date.now()}-${ind+1}.jpeg`;

		await sharp(file.buffer)
		.resize(2000, 1333)
		.toFormat('jpeg')
		.jpeg({quality: 90})
		.toFile(`public/img/tours/${filename}`);
		req.body.images.push(filename);
	})
);

	next();
});

//if we had only one field with multiple images we could have used upload.array('name', 3);

exports.aliasTopTours = (req, res, next) => {
	console.log("started using alias middleware");
	req.query.limit = '5',
	req.query.sort = '-ratingsAverage,price',
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

	console.log("just finished using alias middleware");

	next();
}




exports.getAllTours = factory.getAll(Tour);

 exports.getTour = factory.getOne(Tour, {path: 'reviews'});






exports.addTour = factory.createOne(Tour);

exports.editTour = factory.updateOne(Tour);


exports.removeTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {

		// set aggregate stages
		const stats = await Tour.aggregate([

				{
				$match: {
					ratingsAverage: {
						$gte: 4.5
					}
					}

				},

				{
					$group: {
					_id:{$toUpper:  '$difficulty'},
					// _id: {$toUpper: '$ratingsAverage'},
					//inccrement by 1 counter
					numTours: {$sum: 1},
					numRatings: {$sum: '$ratingsQuantity'},

					avgRating: {$avg: '$ratingsAverage'},
					avgPrice: {$avg: '$price'},
					minPrice: {$min: '$price'},
					maxPrice: {$max: '$price'},


					}

				},
				{

					$sort: {
						avgPrice: 1
					}
				},

				{	$match: {
						_id: {$ne: 'EASY'}

					}
				}


			]);

		res.status(200)
		.json({
			status: "success",
			data: {
				stats
			}
		});


});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
console.log(`shiit i got called `);

		// set aggregate stages
	const year = req.params.year*1;

	const plan = await Tour.aggregate([
			{
				$unwind: '$startDates'
			},
			//now select docs for the year passed in (query)
			{
				$match: {
					//date should be >= jan 1 of year passed & <= dec31 of year passed
					startDates: {
						$gte: new Date(`${year}-01-01`),
						$lte: new Date(`${year}-12-31`)
					}
				}
			},
			{
					//we wanna group by month
				$group: {
					_id: {$month: '$startDates'},
					numTourStarts: {$sum: 1},
						// create an array of tours using $ush
					tours: {$push: '$name'}

					}
			},
			{
				$addFields: { month: '$_id' }
			},
			{
				// we can use binary 0 or 1 to show or unshow fields
				$project: {
					_id: 0
				}
			},
			{
				// sort tour start dates descending order...highes number first
				$sort: {numTourStarts: -1}
			},
			//limiting the result to 6 just for show off here
			// {
			// 	$limit: 2
			// }



		]);


		res.status(200)
		.json({
			status: "success",
			data: {
				plan
			}
		});

});



// tours-within/233/center/34.111745,-118.113491/unit/mi

exports.getToursWithin = catchAsync ( async (req, res, next) => {

	const { distance, latlng, unit } = req.params;
	// extract coordinates from latlng
	const [lat, lng] = latlng.split(',');
	// unit has to be in miles or km
	const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

	if(!lat || !lng) {
		next(new AppError('Please Provide Latitude and Longitude in the Format like this lat,lng.', 400));
	}

	console.log(distance, lat, lng, unit);

	const tours = await Tour.find({ startLocation: { $geoWithin: {$centerSphere: [[lng, lat], radius] } } });


	res.status(200).json({
		status: 'success',
		results: tours.length,
		data: {
			data: tours
		}


	})
});




exports.getDistances = catchAsync(async (req, res, next) => {

	const {latlng, unit } = req.params;
	// extract coordinates from latlng
	const [lat, lng] = latlng.split(',');


	// set our multiplier to be the equivalent of 1meter in miles so conversion can be made to miles

	//this means if we want our result to be returned in km we specify it in the unit req.params and the data which is by default stored in meters is then multiplied by 0.001 to become meters if we want it in miles we specify mi in the req.params unit and the data stored in meters would be multiplied by 0.000621371 to be converted to miles
	const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

	if(!lat || !lng) {
		next(new AppError('Please Provide Latitude and Longitude in the Format like this lat,lng.', 400));
	}


	const distances = await Tour.aggregate([
			{
				$geoNear: {
					near: {
						type: 'Point',
						coordinates: [lng * 1, lat * 1]
					},
					//specify the 2dsphere index to be used by the geoNear
					key: "startLocation",
					distanceField: 'distance',
					//dividing by 1000
					distanceMultiplier: multiplier
				}
			},
			{
				$project: {
					distance: 1,
					name: 1
				}
			}
]);


	res.status(200).json({
		status: 'success',

		data: {
			data: distances
		}


	});



});
