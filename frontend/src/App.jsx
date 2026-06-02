import react from 'react';
import { useState } from "react";
import Footer from "./Footer";
import { BrowserRouter } from "react-router-dom";
import { Routes, Route } from 'react-router-dom';

import Register from "./pages/register";
import Navbar from './components/navbar';

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
      <Footer></Footer>
    </>
  );
}

export default App;