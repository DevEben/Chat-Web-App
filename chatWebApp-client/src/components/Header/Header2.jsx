import './Header.css'; // Create this CSS file for styling
import { useNavigate, Link } from 'react-router-dom';
import { FaUserCircle } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import logo from '../../assets/ChatApp-Logo-(ChatGlow).png';
import axios from 'axios';
import { useState } from 'react';

const Header2 = () => {
    const user = localStorage.getItem('userData');

    let parsedUser = null;
    try {
        parsedUser = user ? JSON.parse(user) : null;
    } catch (error) {
        toast.error('Error parsing token: ' + (error.response?.data?.message || error.message));
        console.error('Error parsing token:', error);
        parsedUser = null;
    }

    const navigate = useNavigate();
    const [isUserDialogVisible, setIsUserDialogVisible] = useState(false);

    const userDialog = () => {
        setIsUserDialogVisible(!isUserDialogVisible);
    }

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Token not found in localStorage ');
                console.error('Token not found in localStorage');
                return;
            }

            const newToken = JSON.parse(token);

            const config = {
                headers: {
                    'Authorization': `Bearer ${newToken}`
                }
            };

            const response = await axios.post(`/api/signout`, {}, config);

            localStorage.clear();
            toast.success(response.data.message);
            navigate('/login&signup');
        } catch (error) {
            toast.error(`Error logging out: ${error.response?.data?.message || error.message}`);
        }
    };

    return (
        <>
            <header>
                <Link to="/">
                    <img src={logo} alt="ChatGlow Logo" className="logo" />
                </Link>
                <nav>
                    <FaUserCircle
                        onClick={userDialog}
                        style={{ width: "50px", height: "30px", position: "relative", cursor: "pointer", color: "#099cc9" }}
                        id='user'
                    />
                </nav>
                {isUserDialogVisible && (
                    <div className='userDialog'>
                        <div className="avatarImageNew">
                            <img src={parsedUser.avatar.url} alt="avatar" />
                            <h4 className='username'>{parsedUser.username}</h4>
                        </div>
                        {console.log(parsedUser.username)}
                        <div
                            onClick={handleLogout}
                            className='logoutBtn'
                            id='logoutBtn'
                        >
                            <CiLogout className='logoutIcon' />
                            &nbsp; Logout
                        </div>
                    </div>
                )}
            </header>
            {/* <ToastContainer /> */}
        </>
    );
}

export default Header2;
