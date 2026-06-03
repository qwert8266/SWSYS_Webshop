import react from 'react';
import { useState } from "react";
import Footer from "./Footer";
import { BrowserRouter } from "react-router-dom";
import { Routes, Route } from 'react-router-dom';

import Register from "./pages/register";
import Login from "./pages/login"
import Navbar from './components/navbar';

function App() {
  return (
    <>
        <Navbar />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />}/>
      </Routes>
      <Footer></Footer>
    </>
  );
}

export default App;