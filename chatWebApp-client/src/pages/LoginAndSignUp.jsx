import LoginAndSignUp from "../components/LoginAndSignUp/LoginAndSignUp";
import 'react-toastify/dist/ReactToastify.css'; 
import { ToastContainer } from 'react-toastify'; 


export default function() {
    return (
        <>
        <ToastContainer /> {/* Use ToastContainer from react-toastify */}
        <LoginAndSignUp />
        </>
    )
}