const AppError = require('../../utils/appError.js');

// error for when the input value of query in wrong format
const handleCastErrorDB = (err) => {
	console.log('i  handle cast error was called')
	const message = `Invalid ${err.path}: ${err.value}.`;
	return new AppError(message, 400);
}

// handling errors that arise from trying to create duplicate fields
const handleDuplicateFieldsDB = (err) => {
	const inputVal = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
	const message = `Duplicate field value: ${inputVal}. Please use another Value`;

	return new AppError(message, 400);
}


//error from updating data with invalid data
const handleValidationErrorDB = (err) => {

	const errors = Object.values(err.errors).map((el) => el.message)
	const message = `Invalid Input Data. ${errors.join('. ')}`;

	return new AppError(message, 400);
}

const handleJWTError = () => new AppError('Invaid Token Please Login Again', 401);



const handleJWTExpiredError = () => new AppError('Expired Token Please Login Again', 401);


const sendErrorDev = (err, req, res) => {
	console.log(req.originalUrl)
	if(req.originalUrl.startsWith('/api')){
			//api
			return res.status(err.statusCode).json({
				status: err.status,
				error: err,
				message: err.message,
				stack: err.stack
			});
		}
			// rendered website
			return res.status(err.statusCode).render('error', {
				title: 'Something Went Wrong!!!',
				msg: err.message
			});



}


const sendErrorProd = (err, req, res) => {
	console.log('i send error production was called')
	if(req.originalUrl.startsWith('/api') ){
		//api
		if(err.isOperational){

			return res.status(err.statusCode).json({
			status: err.status,

			message: err.message

		});
		}
			console.error('Error', err);
			return res.status(500).json({
				status: 'error',
				message: 'Oops!! Something went very Wrong 😫'
			})



	}
		//rendered website
		if(err.isOperational){
			return res.status(err.statusCode).render('error', {
				title: 'Something Went Wrong!!!',
				msg: err.message
			});
		}
			console.error('Error', err);

			return res.status(500).render('error', {
				title: 'Something Went Wrong!!!',
				msg: 'Oops!! Something went very Wrong 😫'
			});







}


const globalErrorHandler = (err, req, res, next) => {
	console.log('the error guy was called', err);
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';




	if(process.env.NODE_ENV === 'development'){
		sendErrorDev(err, res);
	} else if(process.env.NODE_ENV === 'production'){
		// because we wanna use the old version of err
		let error = {...err};
		error.message = err.message;
		if(err.name === 'CastError'){

		error = handleCastErrorDB(error);
		} else if(err.code === 11000){
			error = handleDuplicateFieldsDB(error);
		} else if(err.name === "ValidationError"){
			error = handleValidationErrorDB(error);
		} else if(err.name === 'JsonWebTokenError'){
			error = handleJWTError();

		} else if(err.name === 'TokenExpiredError'){
			error = handleJWTExpiredError();
		}


		sendErrorProd(error, res);
	}


}


module.exports = globalErrorHandler;
