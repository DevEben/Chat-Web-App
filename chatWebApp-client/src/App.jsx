import React from "react";
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import './App.css';

// import LoginAndSignUp from "./pages/Login&SignUp";
import Homepage from "./pages/Homepage";
import Chat from "./pages/Chat";
import LoginAndSignUp from "./pages/LoginAndSignUp";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Homepage />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/login&signup" element={<LoginAndSignUp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
