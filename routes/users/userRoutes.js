const express = require('express');


const {fetchAllUsers, createUser, fetchUser, editUser, deleteUser, updateMe, deleteMe, getMe, uploadUserPhoto, resizeUserPhoto} = require('../../controllers/users/usersController.js');


const {signUp, login, logout, forgotPassword, resetPassword, updatePassword, protect, restrictTo} = require('../../controllers/auth/authController.js');


const router = express.Router();


//auth
//as u can imagine url would be /users/signup
router.post('/signup', signUp);

router.post('/login', login);

router.get('/logout', logout);

router.post('/forgotPassword', forgotPassword);

router.patch('/resetPassword/:token', resetPassword);




// all endpoints from here downwards need protection
// so we can do a general protect
// this works because middleware are attended to serially according to order of positioning by express
router.use(protect);

router.patch('/updateMyPassword', updatePassword);
router.get('/me', getMe, fetchUser);
// todo npm install multer
// we use multer for image upload in the updateMe user route, single() means we only wanna upload one image we pass in the field name that carries the image upload
router.patch('/updateMe',uploadUserPhoto, resizeUserPhoto, updateMe);

router.delete('/deleteMe', deleteMe);
// users
//mount the userRouter
//restful routes
// /users

router.use(restrictTo('admin'));
// these endpoints should only be accesed by special users
router.route('/')
.get(fetchAllUsers)
.post(createUser);

// /user/id
router.route('/:uniqShii')
.get(fetchUser)
.patch(editUser)
.delete(deleteUser);




module.exports = router;
