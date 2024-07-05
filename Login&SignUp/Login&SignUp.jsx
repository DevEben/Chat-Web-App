import React, { useState } from 'react';
import './Login&SignUp.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import { IoCloudUpload } from "react-icons/io5";
import logo from '../../assets/ChatApp-Logo-(ChatGlow).png';
import axios from 'axios';

const LoginAndSignUp = () => {
    const navigate = useNavigate();
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loadingSignup, setLoadingSignup] = useState(false);

    const signup = async (event) => {
        event.preventDefault();
        setLoadingSignup(true);

        try {
            const email = event.target.elements.Email.value;
            const password = event.target.elements.Password.value;
            const username = event.target.elements.Username.value;
            const avatar = event.target.elements.Avatar.files[0]; // Assuming avatar is a file input

            if (!validateEmail(email) || !validatePassword(password)) {
                toast.error('Email or Password is wrong');
                setLoadingSignup(false);
                return;
            }

            if (!validateField(username)) {
                toast.error('Username is required');
                setLoadingSignup(false);
                return;
            }

            if (avatar && avatar.size > 4 * 1024 * 1024) { // 4MB in bytes
                toast.error('Profile picture size should be less than 4MB');
                setLoadingSignup(false);
                return;
            }

            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('avatar', avatar);

            const response = await axios.post('/api/signup', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const data = response.data;
            localStorage.setItem('token', data.token);
            toast.success(data.message);
            setTimeout(() => {
                navigate('/login-signup');
                handleSignInClick();
                event.target.reset();
            }, 2000); // Delay navigation for 2 seconds
        } catch (error) {
            console.error('Failed to create user:', error);
            toast.error(error.response.data.message);
        } finally {
            setLoadingSignup(false);
        }
    };

    const login = async (event) => {
        event.preventDefault();
        setLoadingLogin(true);

        try {
            const email = event.target.elements.Email.value;
            const password = event.target.elements.Password.value;

            if (!validateEmail(email) || !validatePassword(password)) {
                toast.error('Email or Password is wrong');
                setLoadingLogin(false);
                return;
            }

            const response = await axios.post('/api/login', {
                email,
                password
            });

            const data = response.data;
            const userData = {
                username: data.User.username,
                userId: data.User.userId,
                avatar: data.User.avatar
            };
            localStorage.setItem('token', JSON.stringify(data.token));
            localStorage.setItem('userData', JSON.stringify(userData));
            toast.success(data.message);
            setTimeout(() => {
                navigate('/chat');
                event.target.reset();
            }, 4000); // Delay navigation for 4 seconds
        } catch (error) {
            console.error('Failed to sign in:', error);
            toast.error(error.response.data.message);
        } finally {
            setLoadingLogin(false);
        }
    };

    const validateEmail = (email) => {
        const expression = /^[^@]+@\w+(\.\w+)+\w$/;
        return expression.test(email);
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const validateField = (field) => {
        return field != null && field.length > 0;
    };

    const handleSignUpClick = () => {
        const container = document.querySelector(".container");
        container.classList.add("sign-up-mode");
    };

    const handleSignInClick = () => {
        const container = document.querySelector(".container");
        container.classList.remove("sign-up-mode");
    };

    return (
        <div className="container">
            <ToastContainer />
            <div className="signin-signup">
                <form className="sign-in-form" onSubmit={login}>
                    <div className="headerImg">
                        <Link to='/home'>
                            <img src={logo} alt="Chat-Glow-Logo" />
                        </Link>
                    </div>
                    <h2 className="title">Login</h2>
                    <div className="input-field">
                        <FaUser />
                        <input type="text" placeholder="Email" name="Email" className="Email" />
                    </div>
                    <div className="input-field">
                        <FaLock />
                        <input type="password" placeholder="Password" name="Password" className="Password" />
                    </div>
                    <button type="submit" className="btn" disabled={loadingLogin}>
                        {loadingLogin ? (
                            <>
                                Signing in..  &nbsp;&nbsp;&nbsp;
                                <div className="loader"></div>
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </button>
                    <p className="account-text">Don't have an account?
                        <a href="#" id="sign-up-btn2" onClick={handleSignUpClick}>
                            Login {loadingSignup && <div className="loader"></div>}
                        </a>
                    </p>
                </form>

                <form className="sign-up-form" onSubmit={signup}>
                    <div className="headerImg">
                        <Link to='/home'>
                            <img src={logo} alt="Chat-Glow-Logo" />
                        </Link>
                    </div>
                    <h2 className="title">Sign up</h2>
                    <div className="input-field">
                        <FaUser />
                        <input type="text" placeholder="Username" name="Username" className="Username" />
                    </div>
                    <div className="input-field">
                        <FaEnvelope />
                        <input type="text" placeholder="Email" name="Email" className="Email" />
                    </div>
                    <div className="input-field">
                        <IoCloudUpload />
                        <input type="file" placeholder="Profile Picture" name="Avatar" className="Avatar" />
                    </div>
                    <div className="input-field">
                        <FaLock />
                        <input type="password" placeholder="Password" name="Password" className="Password" />
                    </div>
                    <button type="submit" className="btn" disabled={loadingSignup}>
                        {loadingSignup ? (
                            <>
                                Signing up..  &nbsp;&nbsp;&nbsp;
                                <div className="loader"></div>
                            </>
                        ) : (
                            'Sign up'
                        )}
                    </button>
                    <p className="account-text">Already have an account?
                        <a href="#" id="sign-in-btn2" onClick={handleSignInClick}>
                            Sign in {loadingLogin && <div className="loader"></div>}
                        </a>
                    </p>
                </form>
            </div>
            <div className="panels-container">
                <div className="panel left-panel">
                    <div className="content">
                        <h3>Already signed up?</h3>
                        <p>Welcome to Rapid Feedback<br />Sign in to continue</p>
                        <button className="btn2" id="sign-in-btn" onClick={handleSignInClick}>Sign in</button>
                    </div>
                    <img src="../../Sign-in.jpg" alt="Signin" className="image" />
                </div>
                <div className="panel right-panel">
                    <div className="content">
                        <h3>Are you an ADMIN?</h3>
                        <p>Sign up to Rapid Feedback<br />Sign up to continue</p>
                        <button className="btn2" id="sign-up-btn" onClick={handleSignUpClick}>Sign up</button>
                    </div>
                    <img src="../../sign-up.jpg" alt="SignUp" className="image" />
                </div>
            </div>
        </div>
    );
};

export default LoginAndSignUp;
