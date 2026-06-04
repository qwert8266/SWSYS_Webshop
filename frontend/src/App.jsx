import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import Navbar from './components/navbar';
import ShoppingCart from './pages/shoppingCart';
import Test from './pages/test';

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/cart" element={<ShoppingCart />} />
          <Route path="/test" element={<Test/>} /> 

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;