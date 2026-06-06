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
import Category from "./pages/categories";
import {biere, weine,schnäpse, top_banners } from "./pages/categories"
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
          <Route path="/bier" element={<Category products={biere} banner={top_banners[0]}/>} />
          <Route path="/wein" element={<Category products={weine} banner={top_banners[1]}/>} />
          <Route path="/schnaps" element={<Category products={schnäpse} banner={top_banners[2]}/>} />
          {/*<Route path="/test" element={<Test/>} /> */}

        </Routes>
        <Footer></Footer>
      </BrowserRouter>
    </>
  );
}

export default App;