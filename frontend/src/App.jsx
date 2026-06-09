import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Navbar from './components/navbar';
import Home from './pages/home';

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
        <Route path="/home" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;