const crypto = require('crypto');
const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('../../models/userModel.js');
const catchAsync = require('../../utils/catchAsync.js');

const AppError = require('../../utils/appError.js');
const Email = require('../../utils/email.js');


const signToken = (id) => {
	return jwt.sign({id: id}, process.env.JWTITTIES_SEACRIIT, {
		expiresIn: process.env.TITTIES_GET_FLAPPY
	});
}

createAndSendToken = (user, statusCode, res, req) => {
	const token = signToken(user._id);
	 res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });

	//uncomment to use express cookie session
	// req.session.userId = token;

	user.password = undefined;


// status 201 for created
res.status(statusCode).json({
		status: 'success',
		token:token,
		data: {
			user: user
		}
	})

}



//todo npm install jsonwebtoken
exports.signUp = catchAsync(async (req, res, next) => {

	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.confirmPassword
	});
	const url=`${req.protocol}://${req.get('host')}/me`;
	await new Email(newUser, url).sendWelcome();
//create jwt

	createAndSendToken(newUser, 201, res, req);


});





exports.login = catchAsync(async(req, res, next) => {
	console.log("lets check for the email", req.body.email);
	const {email, password} = req.body;

	// 1.)check if email and password exits
	if(!email || !password){
		console.log(' i am the checker')
		return next(new AppError('Please Provide Email and Password', 400));
	}



	// 2.) check if user exists and if password is correct
	//since we already set our user schema to never return a password i.e select:false, we need to explicitly select it here by adding + to the field name
	const user = await User.findOne({email:email}).select('+password');
	// here we access the instance method we set to the userSchema to check if the password is correct


	if(!user || !(await user.validatePassword(password, user.password))){
		return next(new AppError('Incorrect Email or Password', 401));
	}

	// 3.) if everything is ok send token to client
	createAndSendToken(user, 200, res, req);





});


exports.logout = (req, res) => {
	res.cookie('jwt', 'loggedout', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true
	});
	res.status(200).json({status: 'success'});
}





exports.protect = catchAsync(async(req, res, next)=> {

	// 1.) getting token or check if it's there
	let token;
	if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
		token = req.headers.authorization.split(' ')[1];
	} else if(req.cookies.jwt){
		token = req.cookies.jwt;
	}

	if(!token){
		// status code 401 means unauthorized
		return next(new AppError('Please Login to Get Access', 401));
	}

	// 2.) verify the token
	// note the verify() function used here returns a callback by default but since we been using promises all through this api we can convert the callback to a promise using node's inbuilt promisify function so verify() then returns a promise so we can use our async await
	const decoded = await promisify(jwt.verify)(token, process.env.JWTITTIES_SEACRIIT);

	// 3.) check if user still exists if token was verified
	const freshUser = await User.findById(decoded.id);
	if(!freshUser){
		return next(new AppError('This User no Longer Exists', 401));
	}

	// 4.) check if user changed password after the token was issued
	if(freshUser.afterChangeOfPassword(decoded.iat)){
		return next(new AppError('User recently changed Password, Log in Again', 401));
	}

//since the user has access rights the user obj can be useful for determining which data to show to the user in the future, we then attach this user to the req object
req.user = freshUser;
res.locals.user = freshUser;
// so then grant access to the protected route
	next();
});


// only for rendered pages and there will be no errors

// we removed catchAsync here because we do not wanna catch any errors
exports.isLoggedIn = async(req, res, next)=> {

	// 1.) getting token or check if it's there

	if(req.cookies.jwt){
		try {




	// 1.) verify the token
	// note the verify() function used here returns a callback by default but since we been using promises all through this api we can convert the callback to a promise using node's inbuilt promisify function so verify() then returns a promise so we can use our async await
	const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWTITTIES_SEACRIIT);

	// 3.) check if user still exists if token was verified
	const freshUser = await User.findById(decoded.id);
	if(!freshUser){
		return next();
	}

	// 4.) check if user changed password after the token was issued
	if(freshUser.afterChangeOfPassword(decoded.iat)){
		return next();
	}

	//there is a logged in user
	// the pug template can read data from res.locals obj, so we attached the user details there
	res.locals.user = freshUser;
	return next();


		} catch(e){
			return next();
		}
	}
next();
}












// because this is a middleware we cannot mormally pass arguments so we then return the middleware wrapped inside a function (a closure therefore), also since this middleware can take an indefinite number of arguments we put an array into it using es6 syntax..
exports.restrictTo = (...roles) => {
	// returning the middleware inside
	return (req, res, next) => {
		// note the req.user.role here is gotten after the protect middleware has been run
		if(!roles.includes(req.user.role)){
			return next(new AppError('You Don Not Have Permission to Perform This Action', 403));
		}

		next();
	}
}






exports.forgotPassword = catchAsync(async(req, res, next) => {
	// 1.) get user based on posted email
	const user = await User.findOne({email:req.body.email});
	if(!user){
		return next(new AppError('There is no User with email address', 404));
	}


	// 2.) generate random token
	const resetToken = user.createPasswordResetToken();
	//since we updated the passwordResetExpires field in our createPasswordResetToken() function we now have to ensure it is saved into the db by using save() but sine there are some required fields as we are technically doing an update, we then use a special option in the save() which is validateBeforeSave and we set it to false
	await user.save({validateBeforeSave: false});

	// 3.) send it to user as email
	//todo open mailtrap account
	const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;





try {

	// await mailer({
	// 	email: user.email,
	// 	subject: 'Your Password Reset Token (Valid For 10 Mins)',
	// 	message: message
	// });

	await new Email(user, resetURL).sendPasswordReset();

	res.status(200).json({
		status: 'success',
		message: 'Token sent to email!'
	});
} catch(e){
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save({validateBeforeSave: false});
	return next(new AppError('There was an Error Sending The Email, Please Try Again', 500));
}

});



exports.resetPassword = catchAsync(async (req, res, next) => {
	// 1.) get user based on token
	const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
	const user = User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt:Date.now()}});




	// 2.) if token has not expired and there is a user, set the new password
	if(!user){
		return next(new AppError('Token is invalid or has Expired', 400));
	}
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	// here notice we do not turn off validation cos we need it
	await user.save();

	// 3.) update the changedPasswordAt field in the user db



	// 4.) Log the user in, send jwt
	createAndSendToken(user, 200, res, false);

});






exports.updatePassword = catchAsync(async (req, res, next) => {

	// 1.) get the current user
	const user = await User.findById(req.user.id).select('+password');



	// 2.) check if the current password is correct
	if(!(await user.validatePassword(req.body.passwordCurrent, user.password))){
		return next(new AppError('Your Current Password is Wrong', 401));
	}






	// 3.) if so, update password
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	await user.save();


	// 4.) log user in
	createAndSendToken(user, 200, res, req);

});
