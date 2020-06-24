// todo npm install nodemailer
// todo open  mailtrap account
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
	constructor(user, url){
		this.to = user.email;
		this.firstName = user.name.split(' ')[0];
		this.url = url;
		this.from = `Tony Stark ${process.env.EMAIL_FROM}`;
	}


	newTransport(){
		if(process.env.NODE_END === 'production'){
			return nodemailer.createTransport({
				service: 'SendGrid',
				auth: {
					user: process.env.SENDGRID_USERNAME,
					pass: process.env.SENDGRID_PASSWORD
				}
			})
		}
		return nodemailer.createTransport({
				// service: 'Gmail',
				host: process.env.EMAIL_HOST,
				port: process.env.EMAIL_PORT,
				auth: {
					user: process.env.EMAIL_USERNAME,
					pass:process.env.EMAIL_PASSWORD
				}
				//activate in gmail less secure apps
			});
	}

	async send(template, subject){
		// render html based on a pug template
		const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
			firstName: this.firstName,
			url: this.url,
			subject
		});


		// define email mailOptions
		const mailOptions = {
			from: this.from,
			to: this.to,
			subject,
			
			html: htmlToText.fromString(html)
		}


		//create a transport and send Email

		 await this.newTransport().sendMail(mailOptions);
	}

	async sendWelcome(){
		await this.send('welcome', 'Welcome to the Mitours Family')
	}


	async sendPasswordReset(){
		await this.send('passwordReset', 'Your Password Reset Token Valid for Only 10 Minutes');
	}
}
