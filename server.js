//server js contains everything server
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});




var app = require('./app.js');

const mongoose = require('mongoose');
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify:false
})
.then((con)=> {
	console.log("DB connection successful");
})




const port = process.env.PORT || 3000;


	

const server = app.listen(port, 'localhost', ()=> {
	console.log(`server running on port: ${port}`);
});




process.on('uncaughtException', err => {
	console.log("UNCAUGHT EXCEPTION...shutting down...")
	console.log(err.name, err.message)
	console.log("unhandledRejection...shutting down...")
	//handle pending   before closing server
	// here we must really crash the application because after uncaught exception the entire node process is in an unclean state and needs a refresh requests
	server.close(() => {
		process.exit(1);	
	});
})

process.on('unhandledRejection', err=> {
	console.log(err.name, err.message)
	console.log("UNHANDLED REJECTION ...shutting down...")
	//handle pending requests before closing server.. crashing the app here is optional
	server.close(() => {
		process.exit(1);	
	});
	
});

