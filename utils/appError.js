
class AppError extends Error {

	constructor(message, statusCode){
		// we call a super() when extending a parent call to call the parent class's constructor and we here pass in the message because that is what the parent class (in this case Error) constructor was designed to consume
		super(message);

		this.statusCode = statusCode;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
		this.isOperational = true;

//
		Error.captureStackTrace(this, this.constructor);
	}



}

module.exports = AppError;