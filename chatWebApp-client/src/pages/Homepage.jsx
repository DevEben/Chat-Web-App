import React, { useState, useEffect } from 'react';
import Homepage from "../components/Homepage/Homepage"
import Header from "../components/Header/Header"


export default function () {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 834);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 834);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <>
            {!isMobile && <Header />}
            <Homepage />
        </>
    )
}