const multer = require('multer');
const sharp = require('sharp');
const User = require('../../models/userModel.js');
const factory = require('../factory/handlerFactory.js');

const catchAsync = require('../../utils/catchAsync.js');

const AppError = require('../../utils/appError.js');

// since we using an image processor library : sharp for resizing our image it is best pratice to save image to memory and not disk so after processing it can be saved to disk
// const multerStorage = multer.diskStorage({
// 	destination:(req, file, cb) => {
// 		cb(null, 'world/img/users'),
// 		fileName: (req, file, cb) => {
// 			//user-232323-23232323.jpg
// 			const ext = file.mimetype.split('/')[1];
// 			cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
// 		}
// 	}
//
// });

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


exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync( async (req, res, next) => {
	if(!req.file) return next();
	req.file.fileName = `user-${req.user.id}-${Date.now()}.jpeg`;

	await sharp(req.file.buffer)
	.resize(500, 500)
	.toFormat('jpeg')
	.jpeg({quality: 90})
	.toFile(`world/img/users/${req.file.fileName}`);


	next();
});


const filterObj = (objec, ...allowedFields) => {
	const newObj = {};
	// loop through object and ensure the object fields are allowed in the allowedFields array if so then put them in a new object and return
	Object.keys(objec).forEach((obj) => {
		if(allowedFields.includes(obj)) newObj[obj] = objec[obj];
	});
	return newObj;
}


// middleware for getMe
exports.getMe = (req, res, next) => {
	req.params.id = req.user.id;
	next();


}



exports.fetchAllUsers = factory.getAll(User);



exports.createUser = (req, res) => {

	res.status(500)
	.json({
		status: "error",
		message:"Please Use the Sign Up Page"
	})


}

exports.fetchUser = factory.getOne(User);


//for a logged user to update user data

exports.updateMe = catchAsync( async (req,res, next) => {


	// 1.) Create error if user tries to update password
	if(req.body.password || req.body.passwordConfirm){
		return next(new AppError('This Link is not for Password Update, Please Use Update My PAssword Link', 400))
	}




	// 2.) filter out unwanted fields that are not allowed to be updated
	const filteredBody = filterObj(req.body, 'name', 'email');
	if(req.file) filteredBody.photo = req.file.fileName;

	// finally update user
	const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new: true, runValidators:true});





//return newly updated user

	res.status(200).json({
		status: 'success',
		data: {
			user: updatedUser
		}
	});
});



exports.deleteMe = catchAsync( async (req, res, next) => {

	await User.findByIdAndUpdate(req.user.id, {active: false});

	res.status(204).json({
		status: 'success',
		data: null
	});



});




/******               *******/
// for admin , do not update password with this
exports.editUser = factory.updateOne(User);




exports.deleteUser = factory.deleteOne(User);



/*************                  ******/
