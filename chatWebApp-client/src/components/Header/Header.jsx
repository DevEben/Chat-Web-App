import './Header.css'; // Create this CSS file for styling
import { Link } from 'react-router-dom';
import logo from '../../assets/ChatApp-Logo-(ChatGlow).png';

const Header = () => {

    return (
        <>
            <header>
                <Link to="/">
                    <img src={logo} alt="ChatGlow Logo" className="logo" />
                </Link>
                <nav>
                    <Link to="/login&signup" className="nav-button">Login</Link>
                    <Link to="/login&signup" className="nav-button">Sign Up</Link>
                </nav>
            </header>
        </>
    )
}


export default Header;