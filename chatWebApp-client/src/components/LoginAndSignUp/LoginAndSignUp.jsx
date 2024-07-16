import React, { useState } from 'react';
import './LoginAndSignUp.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/ChatApp-Logo-(ChatGlow).png';
import axios from 'axios';

const LoginAndSignUp = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [loadingSignup, setLoadingSignup] = useState(false);
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [selectedButton, setSelectedButton] = useState('Login');
    const navigate = useNavigate();

    const signup = async (event) => {
        event.preventDefault();
        setLoadingSignup(true);
    
        try {
            const formData = new FormData(event.target);
            const email = formData.get('email');
            const password = formData.get('password');
            const username = formData.get('username');
            const avatar = formData.get('avatar');
    
            if (!validateEmail(email) || !validatePassword(password)) {
                toast.error('Invalid email or password');
                setLoadingSignup(false);
                return;
            }
    
            if (!validateField(username)) {
                toast.error('Username is required');
                setLoadingSignup(false);
                return;
            }
    
            if (avatar && avatar.size > 4 * 1024 * 1024) {
                toast.error('Profile picture size should be less than 4MB');
                setLoadingSignup(false);
                return;
            }
    
            const payload = new FormData();
            payload.append('username', username);
            payload.append('email', email);
            payload.append('password', password);
            payload.append('avatar', avatar);
    
            const response = await axios.post('/api/signup', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Set content type to multipart form-data
                },
            });
    
            const data = response.data;
            localStorage.setItem('token', data.token);
            toast.success(data.message);
            setTimeout(() => {
                navigate('/login&signup');
                handleLoginClick();
                event.target.reset();
            }, 2000); // Delay navigation for 2 seconds
        } catch (error) {
            console.error('Failed to create user:', error);
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoadingSignup(false);
        }
    };    
    

    const login = async (event) => {
        event.preventDefault();
        setLoadingLogin(true);

        try {
            const formData = new FormData(event.target);
            const email = formData.get('email');
            const password = formData.get('password');

            if (!validateEmail(email) || !validatePassword(password)) {
                toast.error('Invalid email or password');
                setLoadingLogin(false);
                return;
            }

            const response = await axios.post('/api/login', { email, password });

            const data = response.data;
            const userData = {
                username: data.User.username,
                userId: data.User.userId,
                avatar: data.User.avatar,
            };
            localStorage.setItem('token', JSON.stringify(data.token));
            localStorage.setItem('userData', JSON.stringify(userData));
            toast.success(data.message);
            setTimeout(() => {
                navigate('/chat');
                event.target.reset();
            }, 2000); // Delay navigation for 2 seconds
        } catch (error) {
            console.error('Failed to sign in:', error);
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoadingLogin(false);
        }
    };

    const handleSignupClick = () => {
        setIsSignup(true);
        setSelectedButton('Signup');
    };

    const handleLoginClick = () => {
        setIsSignup(false);
        setSelectedButton('Login');
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

    return (
        <div className='body'>
            <div className='box'>
                <div className='logo'>
                    <Link to='/home'>
                        <img src={logo} alt="" />
                    </Link>
                </div>

                <div className="container">
                    <div className={`slider ${isSignup ? 'moveslider' : ''}`}></div>
                    <div className="btn">
                        <button className="login" onClick={handleLoginClick}>Login</button>
                        <button className="signup" onClick={handleSignupClick}>Signup</button>
                    </div>
                    <h5 style={{textAlign: "center", color: "#021c24", paddingTop: "20px"}}> Welcome to Chat Glow! Please {selectedButton} to continue. </h5>
                    <div className={`form-section ${isSignup ? 'form-section-move' : ''}`}>
                        <div className="login-box">
                            <form onSubmit={login}>
                                <input
                                    type="email"
                                    name="email"
                                    className="email ele"
                                    placeholder="Email"
                                    required
                                />
                                <input
                                    type="password"
                                    name="password"
                                    className="password ele"
                                    placeholder="Password"
                                    required
                                />
                                <button type="submit" className="clkbtn" disabled={loadingLogin}>
                                    {loadingLogin ? (
                                        <>
                                            Signing in..  &nbsp;&nbsp;
                                            <div className="loader"></div>
                                        </>
                                    ) : (
                                        'Login'
                                    )}
                                </button>
                            </form>
                        </div>

                        <div className="signup-box">
                            <form onSubmit={signup}>
                                <input
                                    type="text"
                                    name="username"
                                    className="username ele"
                                    placeholder="Username"
                                    required
                                />
                                <input
                                    type="email"
                                    name="email"
                                    className="email ele"
                                    placeholder="Email"
                                    required
                                />
                                <input
                                    type="file"
                                    name="avatar"
                                    className="avatar ele"
                                    required
                                />
                                <input
                                    type="password"
                                    name="password"
                                    className="password ele"
                                    placeholder="Password"
                                    required
                                />
                                <button type="submit" className="clkbtn" disabled={loadingSignup}>
                                    {loadingSignup ? (
                                        <>
                                            Signing up..  &nbsp;&nbsp;
                                            <div className="loader"></div>
                                        </>
                                    ) : (
                                        'Sign up'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                {/* <ToastContainer /> */}
            </div>
        </div>
    );
};

export default LoginAndSignUp;
