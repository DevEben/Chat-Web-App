import Chat from "../components/Chat/Chat";
import Header2 from "../components/Header/Header2";
import 'react-toastify/dist/ReactToastify.css'; 
import { ToastContainer } from 'react-toastify'; 

export default function YourComponent() {
    return (
        <>
            <Header2 />
            <ToastContainer /> {/* Use ToastContainer from react-toastify */}
            <Chat />
        </>
    )
}
