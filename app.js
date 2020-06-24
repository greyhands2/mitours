const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const cors = require('cors');

const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController/errorController.js');

const tourRouter = require('./routes/tours/tourRoutes.js');
const userRouter = require('./routes/users/userRoutes.js');
const reviewRouter = require('./routes/reviews/reviewRoutes.js');
const bookingRouter = require('./routes/bookings/bookingRoutes.js');
const viewRouter = require('./routes/views/viewRoutes.js');


const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


//middleware for static files
app.use(express.static(path.join(__dirname, 'world')));


// now lets use some 3rd party middleware called morgan for logging
//set security http headers
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));


const limiter = rateLimit({
	// depends on the nature of your api usage
	max: 100,
	// set time limit to 1hr
	windowMs: 60 * 60 * 1000,
	message: 'Too many requests from this IP, try again in an hour'
})
app.use('/api', limiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// app.options('*', cors());

  app.use(cookieParser());


app.use(mongoSanitize());
app.use(xss());

// prevent parameter pollution
app.use(hpp({
	whitelist: [
	'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'
	]
}));


app.use((req, res, next)=>{
	console.log(req.originalUrl)

	console.log("middleware checking here", req.cookies);
	next();
});





app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);

app.use('/api/v1/users', userRouter);

app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
//REST means Representational States Transfer

// middleware to respond error message for undefined routes
app.all('*', (req, res, next)=> {

	// we create an error by initializing the Error class object


//whenever we pass an argument into next() express always sees it as an error message, it will then skip all the other middlware/functions to be executed and pass the error to the global error handler making that error acessible to our default express error middleware
	next(new AppError(`Can't find ${req.originalUrl}  on this server!! 😫`, 404));
});


// using express's error handling middleware
//this error handling middleware has 4 parameters i.e (err, req, res, next)...when express sees this it automatically knows it is an error handling middleware nd therefore call it wherever in the application the Error class is called
app.use(globalErrorHandler);





module.exports = app;









// app.get('/api/v1/tours', tours.getAllTours);
//declaring routes with non  multiple parametrs
// app.get('/api/v1/tours/:id/:x/:y', (req, res)=> {
// 	console.log(req.params);
// })


//optional multiple parameters
// app.get('/api/v1/tours/:id?/:x?/:y?', (req, res)=> {
// 	console.log(req.params);
// })

// app.get('/api/v1/tours/:id', tours.getTour);



// app.post('/api/v1/tours', tours.addTour)




// using patch request to update  data based on specified properties
// app.patch('/api/v1/tours/:id', tours.editTour)


// using delete request to update  data based on specified properties
// app.delete('/api/v1/tours/:id', tours.removeTour)

// route handlers

// a better shortcut
//using middleware to declare tours route
