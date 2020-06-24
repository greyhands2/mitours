//crypto is a built in node module
const crypto = require('crypto')
const mongoose = require('mongoose');
const validator = require('validator');
//todo nm install bcryptjs
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({

	name: {
		type: String,
		required: [true, 'Every User Must Have a Name'],
		unique: true,

	},
	 email: {
	 	type: String,
	 	required: [true, 'Please Provide an Email'],
	 	unique: true,
	 	lowercase:true,
	 	validate: [validator.isEmail, 'Please Provide a Valid Email']

	 },

	 photo: {
	 	type: String,
	 	default: 'default.jpeg'

	 },
	 role: {
	 	type: String,
	 	enum: ['user', 'guide', 'lead-guide', 'admin'],
	 	default: 'user'
	 },
	 password: {
	 	type: String,
	 	required: [true, 'Please Provide a Password'],
	 	minLength: 8,
	 	//ensure password is neevr returned by a query
	 	select: false
	 },
	 passwordConfirm: {
	 	type: String,
	 	required: [true, 'Please Confirm Your Password'],
	 	validate: {
	 		// this only works on save() or create() so when updating a user we have to still use save() or create() so this password validation works
	 		validator: function(el) {
	 			return el === this.password; //this returns true if both passwords are equal else returns false
	 		},
	 		message: 'Passwords aint the same'
	 	},
	 	select:false
	 },
	 passwordChangedAt: Date,
	 passwordResetToken: String,
	 passwordResetExpires: Date,
	 active: {
	 	type: Boolean,
	 	default: true
	 }




});


// use a mongoose middleware to hash passwords
// remember since we wanna hash the passwords before it is saved it is only mongoose document middleware that is suitable here, the "pre" variation of course
userSchema.pre('save', async function(next){
	// first use mongoose internal boolean function isModified to check if password field has been modified or not if it has not been modified then we do not need to hash, if it has then we hash
	if(!this.isModified('password')) return next();

		// use bcrypt for hasing
		// bcrypt salts each password meaning it adds a random string to a passwrd before hashing so that even 2 equal passwords dont generate the same hash

		// note this is the async hash version that returns a promise
		this.password = await bcrypt.hash(this.password, 12);

		this.passwordConfirm = undefined;
		next();


});

//use middleware
userSchema.pre('save', function(next){
// if password wasnt changed or document is new exit this middlware
if(!this.isModified('password') || this.isNew) return next();

this.passwordChangedAt = Date.now() - 1000;
next();

})



//query middleware, to ensure all queries only return documents that have active set to true
userSchema.pre(/^find/, function(next){
	// this points to the current query
	this.find({active: {$ne: false}});
	next();
})


// here we attach a static instance method to the userSchema object
userSchema.methods.validatePassword = async function(candidatePassword, userPassword){

	//compare function returns true or false that can be accessed in any file where the userSchema has been imported
	return await bcrypt.compare(candidatePassword, userPassword);
}




userSchema.methods.afterChangeOfPassword = function(JWTTimestamp){

	if(this.passwordChangedAt){
		//
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		// if this returns true it means password has been changed and if it returns false it means password has not been changed
		return JWTTimestamp < changedTimestamp;
	}

// means password not changed
	return false;
}



userSchema.methods.createPasswordResetToken = function(){

	//generate the random string
	// the token sent to user email for password reset
	const resetToken = crypto.randomBytes(32).toString('hex');
	//hash it and then store it into the db in the passwordResetToken field
	this.passwordResetToken = cryto.createHash('sha256').update(resetToken).digest('hex');

	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

	return resetToken;

}

const User = mongoose.model('User', userSchema);

module.exports = User;
