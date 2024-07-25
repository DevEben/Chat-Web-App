import React from 'react';
import './Footer.css'; // Make sure to import your CSS file
import { Link } from 'react-router-dom';
import siteImg from '../../assets/Site.png';
import social1 from '../../assets/Social-1.png';
import social2 from '../../assets/Social-2.png';
import social3 from '../../assets/Social-3.png'
import social4 from '../../assets/Social-4.png';
import social5 from '../../assets/Social-5.png'
import logo from '../../assets/ChatApp-Logo-black-white.png';

const Footer = () => {

  return (
    <div className="FinalDown">
      <div className="Footer">
        <div className="Logoss">
          <img src={logo} alt="ChatGlow Logo" />
          <Link to='/login&signup'>
          <p className='loginLink'>Log In</p>
          </Link>
        </div>
        <div className="Aboutsss">
          <span>About ChatGlow</span>
          <p>What’s behind the boards.</p>
        </div>
        <div className="Aboutsss">
          <span>Jobs</span>
          <p>Learn about open roles on the <br />ChatGlow team.</p>
        </div>
        <div className="Aboutsss">
          <span>Apps</span>
          <p>Download the ChatGlow App for your <br />Desktop or Mobile devices.</p>
        </div>
        <div className="Aboutsss">
          <span>Contact us</span>
          <p>Need anything? Get in touch and <br />we can help.</p>
        </div>
      </div>
      <div className="StraghtLine"></div>
      <div className="Socials">
        <div className="SocialsL">
          <img src={siteImg} alt="Site" />
          <h5>English</h5>
          <p>Privacy Policy</p>
          <p>Terms</p>
          <p>Copyright © {new Date().getFullYear()} ChatGlow</p>
        </div>
        <div className="SocialsR">
          <img src={social1} alt="Social 1" />
          <img src={social2} alt="Social 2" />
          <img src={social3} alt="Social 3" />
          <img src={social4} alt="Social 4" />
          <img src={social5} alt="Social 5" />
        </div>
      </div>
    </div>
  );
};

export default Footer;
