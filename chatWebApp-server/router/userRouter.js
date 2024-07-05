const express = require('express');

const router = express.Router();

const { signUp, verify, logIn, getOnlineUsers, addFriend, getFriends, getUsers, forgotPassword, resetPasswordPage, resetPassword, signOut, } = require('../controller/userController');
const { authenticate, } = require("../middleware/authentation");
const { upload } = require('../middleware/multer');

//endpoint to register a new user
router.post('/signup', upload.single('avatar'), signUp);

//endpoint to verify a registered user
router.get('/verify/:id/:token', verify);

//endpoint to login a verified user
router.post('/login', logIn);

//endpoint to get all users
router.get('/allusers', authenticate, getUsers);

//endpoint to get all users online
router.get('/online', authenticate, getOnlineUsers);

//endpoint to add friends 
router.post('/add-friend', authenticate, addFriend);

//endpoint to get all friends online
router.get('/friends', authenticate, getFriends);

//endpoint for forget Password
router.post('/forgot', forgotPassword);

//endpoint for reset Password Page
router.get('/reset/:userId', resetPasswordPage);

//endpoint to reset user Password
router.post('/reset-user/:userId', resetPassword);

//endpoint to sign out a user
router.post("/signout", authenticate, signOut);




module.exports = router;