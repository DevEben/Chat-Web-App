import React, { useState, useEffect } from 'react';
import Homepage from "../components/Homepage/Homepage";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import './Homepage.css';

export default function Page() {
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
    <div className="bodyContainer">
      {!isMobile && <Header />}
      <div className="contentContainer">
        <Homepage />
      </div>
      {!isMobile && <Footer />}
    </div>
  );
}
