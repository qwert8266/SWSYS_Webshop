import React from "react";
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import Register from "./pages/register";
import Login from "./pages/login"
import Navbar from './components/navbar';
import HideNavbar from './components/hideNavbar';
import Footer from "./components/footer";
import ShoppingCart from './pages/shoppingCart';
//import Test from './pages/test';

function App() {
  return (
    <>
      <BrowserRouter>
        <HideNavbar>
          <Navbar />
        </HideNavbar>

        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />}/>
          <Route path="/cart" element={<ShoppingCart />} />
          {/*<Route path="/test" element={<Test/>} /> */}

        </Routes>
        <Footer></Footer>
      </BrowserRouter>
    </>
  );
}

export default App;