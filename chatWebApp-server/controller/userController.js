const userModel = require("../model/userModel");
const { validateUser, validateUserLogin, } = require("../middleware/validator");
const cloudinary = require('../middleware/cloudinary');
const fs = require('fs');
const path = require('path');
const asyncHandler = require('express-async-handler');
const bcrypt = require("bcrypt");
const sendMail = require("../utils/email");
const jwt = require('jsonwebtoken');
const { generateDynamicEmail } = require("../utils/emailText");
const { resetFunc } = require('../utils/forgot');
const verifiedHTML = require('../utils/verified');
const resetHTML = require('../utils/resetHTML');
require('dotenv').config();



//Function to register a new user
const signUp = asyncHandler(async (req, res) => {
    try {
        const { error } = validateUser(req.body);
        if (error) {
            return res.status(500).json({
                message: error.details[0].message
            })
        } else {
            const toTitleCase = (inputText) => {
                let word = inputText.toLowerCase()
                let firstWord = word.charAt(0).toUpperCase()

                return firstWord + (word.slice(1))
            }

            const userData = {
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
            }

            const emailExists = await userModel.findOne({ email: userData.email });
            if (emailExists) {
                return res.status(200).json({
                    message: 'Email already exists',
                })
            }

            const salt = bcrypt.genSaltSync(12)
            const hashpassword = bcrypt.hashSync(userData.password, salt);

                // Upload image to Cloudinary if available
        if (!req.file) {
            return res.status(400).json({
                message: "No file was uploaded"
            });
        }

        // Path to the uploaded file
        const imageFilePath = path.resolve(req.file.path);

        // Check if the file exists before proceeding
        if (!fs.existsSync(imageFilePath)) {
            return res.status(400).json({
                message: "Uploaded file not found"
            });
        }

        // Upload the image to Cloudinary
        const cloudinaryUpload = await cloudinary.uploader.upload(imageFilePath, {
            folder: "avatarImages"
        });

            const user = await new userModel({
                username: toTitleCase(userData.username),
                email: userData.email,
                password: hashpassword,
                avatar: {
                    public_id: cloudinaryUpload.public_id,
                    url: cloudinaryUpload.secure_url,
                },
            });
            if (!user) {
                return res.status(404).json({
                    message: 'User not found',
                })
            }

            const token = jwt.sign({
                username: user.username,
                email: user.email,
            }, process.env.SECRET, { expiresIn: "300s" });

            user.token = token;
            const subject = 'Email Verification'
            const link = `${req.protocol}://${req.get('host')}/api/verify/${user.id}/${user.token}`

            const html = generateDynamicEmail(user.username, link)
            sendMail({
                email: user.email,
                html,
                subject
            })
            await user.save()

            return res.status(200).json({
                message: 'User profile created successfully \nPlease check your mail to verify your account',
                data: user,
            })

        }
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error: " + error.message,
        })
    } finally {
        fs.unlinkSync(path.resolve(req.file.path));
    }
});



//Function to verify a new user with a link
const verify = async (req, res) => {
    try {
        const id = req.params.id;
        const token = req.params.token;
        const user = await userModel.findById(id);

        // Verify the token
        jwt.verify(token, process.env.SECRET);

        // Update the user if verification is successful
        const updatedUser = await userModel.findByIdAndUpdate(id, { isVerified: true }, { new: true });
        // res.status(200).send("<h4>You have been successfully verified. Kindly visit the login page.</h4> <script>setTimeout(() => { window.location.href = '/api/v1/login'; }, 5000);</script>");
        // return;
        return res.send(verifiedHTML(req));

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            // Handle token expiration
            const id = req.params.id;
            const updatedUser = await userModel.findById(id);
            //const { firstName, lastName, email } = updatedUser;
            const newtoken = jwt.sign({ email: updatedUser.email, username: updatedUser.username }, process.env.SECRET, { expiresIn: "300s" });
            updatedUser.token = newtoken;
            updatedUser.save();

            const link = `${req.protocol}://${req.get('host')}/api/verify/${id}/${updatedUser.token}`;
            sendMail({
                email: updatedUser.email,
                html: generateDynamicEmail(updatedUser.username, link),
                subject: "RE-VERIFY YOUR ACCOUNT"
            });
            // res.status(401).send("<h4>This link is expired. Kindly check your email for another email to verify.</h4><script>setTimeout(() => { window.location.href = '/api/v1/login'; }, 5000);</script>");
            // return;
            return res.send(verifiedHTML(req));
        } else {
            return res.status(500).json({
                message: "Internal server error: " + error.message,
            });
        }
    }
};


//Function to login a verified user
const logIn = async (req, res) => {
    try {
        const { error } = validateUserLogin(req.body);
        if (error) {
            return res.status(500).json({
                message: error.details[0].message
            })
        } else {
            const { email, password } = req.body;
            const checkEmail = await userModel.findOne({ email: email.toLowerCase() });
            if (!checkEmail) {
                return res.status(404).json({
                    message: 'User not registered'
                });
            }
            const checkPassword = bcrypt.compareSync(password, checkEmail.password);
            if (!checkPassword) {
                return res.status(404).json({
                    message: "Password is incorrect"
                })
            }
            const token = jwt.sign({
                userId: checkEmail._id,
                username: checkEmail.username,
            }, process.env.SECRET, { expiresIn: "5h" });

            checkEmail.token = token;
            await checkEmail.save();
            const details = {
                username: checkEmail.username,
                email: checkEmail.email,
                userId: checkEmail._id,
                avatar: checkEmail.avatar,
            }

            if (checkEmail.isVerified === true) {
                return res.status(200).json({
                    message: "Login Successfully! Welcome " + checkEmail.username,
                    token: token,
                    User: details,
                })
            } else {
                return res.status(400).json({
                    message: "Sorry user not verified yet. Check your mail to verify your account!"
                })
            }
        }

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error: " + error.message,
        });
    }
};


//Function for the user incase password is forgotten
const forgotPassword = async (req, res) => {
    try {
        const checkUser = await userModel.findOne({ email: req.body.email });
        if (!checkUser) {
            return res.status(404).json({
                message: 'Email does not exist'
            });
        }
        else {
            const subject = 'Kindly reset your password'
            const link = `${req.protocol}://${req.get('host')}/api/v1/reset/${checkUser.id}`
            const html = resetFunc(checkUser.firstName, link)
            sendMail({
                email: checkUser.email,
                html,
                subject
            })
            return res.status(200).json({
                message: "Kindly check your email to reset your password",
            })
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error: ' + error.message,
        })
    }
};

//Funtion to send the reset Password page to the server
const resetPasswordPage = async (req, res) => {
    try {
        const userId = req.params.userId;
        const resetPage = resetHTML(userId);

        // Send the HTML page as a response to the user
        res.send(resetPage);
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error: ' + error.message,
        });
    }
};



//Function to reset the user password
const resetPassword = async (req, res) => {
    try {
        const userId = req.params.userId;
        const password = req.body.password;

        if (!password) {
            return res.status(400).json({
                message: "Password cannot be empty",
            });
        }

        const salt = bcrypt.genSaltSync(12);
        const hashPassword = bcrypt.hashSync(password, salt);

        const reset = await userModel.findByIdAndUpdate(userId, { password: hashPassword }, { new: true });
        return res.status(200).json({
            message: "Password reset successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error: ' + error.message,
        })
    }
};



//Function to signOut a user
const signOut = async (req, res) => {
    try {
        const userId = req.user.userId
        const newUser = await userModel.findById(userId)
        if (!newUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        newUser.token = null;
        await newUser.save();
        return res.status(201).json({
            message: `user has been signed out successfully`
        })
    }
    catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error: ' + error.message,
        })
    }
}



const getUsers = async (req, res) => {
    try {
        const Users = await userModel.find().select('-password -lastLogin -isVerified -friends');
        if (!Users) {
            return res.status(404).json({
                message: "Users not found"
            })
        }
        return res.status(200).json({users: Users});
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error: ' + error.message,
        })
    }
};



const getOnlineUsers = async (req, res) => {
    try {
        const onlineUsers = await userModel.find({ online: true }).select('username');
        if (!onlineUsers) {
            return res.status(404).json({
                message: "Users not found"
            })
        }
        return res.status(200).json({
            onlineUsers
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error: ' + error.message,
        })
    }
};



const addFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        const user = await userModel.findById(req.user.userId);

        if (!user.friends.includes(friendId)) {
            user.friends.push(friendId);
            await user.save();
            return res.json({ msg: 'Friend added successfully' });
        } else {
            return res.status(400).json({ msg: 'User already added as a friend' });
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error: ' + error.message,
        })
    }
};


const getOnlineUser = async () => {
    try {
        const onlineUsers = await userModel.find({ online: true }).select('username');
        if (!onlineUsers) {
            throw new Error("Users not found")
        }
        return onlineUsers.map(user => user._id.toString());
    } catch (error) {
        throw new Error('Internal Server Error: ' + error.message)
    }
};


const getFriends = async (req, res) => {
    try {
      const user = await userModel.findById(req.user.userId).populate('friends', 'username');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const onlineUsers = await getOnlineUsers1(); // Implement this function to get the list of online users
      const friendsWithStatus = user.friends.map(friend => ({
        _id: friend._id,
        username: friend.username,
        online: onlineUsers.includes(friend._id.toString())
      }));
      return res.json(friendsWithStatus);
    } catch (error) {
      return res.status(500).json({
        message: 'Internal Server Error: ' + error.message,
      });
    }
  };



module.exports = {
    signUp,
    verify,
    logIn,
    forgotPassword,
    resetPasswordPage,
    resetPassword,
    signOut,
    getOnlineUsers,
    addFriend,
    getFriends,
    getUsers,
}