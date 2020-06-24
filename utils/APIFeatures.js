
class APIFeatures {

	constructor(queryModel, queryString){
		this.queryModel = queryModel;
		this.queryString = queryString;
	}



	filterer(){
		//using es6 destructuring we enforce a new independent  object queryObject containing the data from req.query but isnt tied to it meaning it doesnt change if req.query is mutated in the future
		const queryObj = {...this.queryString};
	//initialize our filter query names
	const excludedFields = ['page', 'sort', 'limit', 'fields'];
	//exclude these filter quey names from our req.query object
	excludedFields.forEach(el => delete queryObj[el]);

	
	//1.) advanced filterng
	let queryStr = JSON.stringify(queryObj);

	queryStr = JSON.parse(queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`));
	console.log(queryStr);
    this.queryModel = this.queryModel.find(queryStr);


    return this;
	}



	sorter(){

		//2.) advanced sorting
	if(this.queryString.sort){
	const sortBy = this.queryString.sort.split(",").join(' ');
		//using mongoose to sort
		this.queryModel = this.queryModel.sort(sortBy);
	} else {
		this.queryModel = this.queryModel.sort('-createdAt');
	}


	return this;
	}



	fieldLimiter(){
		//3.) field limiting
	if(this.queryString.fields){
	const fields = this.queryString.fields.split(",").join(' ');
		this.queryModel = this.queryModel.select(fields);
	} else {
		this.queryModel = this.queryModel.select('-__v');
	}

	return this;
	}





	paginator(){
		//4.) pagination

		const page = this.queryString.page*1 || 1;
		const lim = this.queryString.limit*1 || 100;

		const skip = (page - 1) * lim;


//localhost:3000/api/v1/tours?page=2&limit=10
//for page 2 request limit=10 , skip 10 means page1 = 1-10, page2=11-20...page 3 request would be skip(20) , page 4 initial request skip(40)
	// if(this.queryString.page) {
	// 	const numTours = await Tour.countDocuments();
	// 	if(skip >= numTours) throw new Error("This Page Does Not Exist");
	// }
		this.queryModel = this.queryModel.skip(skip).limit(lim);


		return this;
	}

	
}

module.exports = APIFeatures;