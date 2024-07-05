import React from 'react';
import './Homepage.css';
import { Link } from 'react-router-dom';
import logo from '../../assets/ChatApp-Logo-(ChatGlow).png';
import heroImage from '../../assets/hero-image.gif';
import backgroundImage from '../../assets/bckgrd2.png';


const HomePage = () => {
  return (
    <body style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundRepeat: "no-repeat" }} >
      <div className="homepage">
        <div className='heroImage'>
          <img src={heroImage} alt="Hero" />
        </div>
        <main>
          <div className='logoContainer'>
            <img src={logo} alt="Chat-Glow-Logo" />
          </div>
          <h1>Welcome to ChatGlow</h1>
          <p className="description">
            Connect with friends, share your moments, and let your conversations shine! ChatGlow is the vibrant community where you can express yourself freely and stay connected with those who matter most.
          </p>
          <div className='Btn'>
            <Link to='/login&signup'>
              <button className='loginBtn'>Log in</button>
            </Link>
            <Link to='/login&signup'>
              <button className='signUpBtn'>Sign up</button>
            </Link>
          </div>
        </main>
      </div>
    </body>
  );
};

export default HomePage;
