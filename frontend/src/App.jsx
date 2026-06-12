import React from "react";
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css';

import ProtectedRoutes from "./routes/protectedRoutes";

import CookieBanner from "./components/cookie_banner";
import Register from "./pages/register";
import Login from "./pages/login"
import Navbar from './components/navbar';
import HideNavbar from './components/hideNavbar';
import Footer from "./components/footer";
import ShoppingCart from './pages/shoppingCart';
import Checkout from "./pages/checkout";
import AccountSettings from "./pages/accountSettings";
import Contact from "./pages/contact";
import Category from "./pages/categories";
//import {biere, weine,schnäpse, top_banners } from "./pages/categories"
import Product from "./pages/product";
import {produkte} from "./pages/product";
import Home from './pages/home';
//import Test from './pages/test';

function App() {
  return (
    <>
      <BrowserRouter>
        <HideNavbar>
          <Navbar />
        </HideNavbar>

        <Routes>
          <Route path="" element={<CookieBanner/>}/>
          <Route path="/home" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />}/>
          <Route path="/cart" element={<ShoppingCart />} />
          <Route path="/contact" element={<Contact/>}/>
          <Route path="/cart/checkout" element={
            <ProtectedRoutes>
              <Checkout/>
            </ProtectedRoutes>
          }/>
          <Route path="account-settings" element={
            <ProtectedRoutes>
              <AccountSettings/>
            </ProtectedRoutes>
          }/>
          
          <Route path="/sortiment" element={<Navigate to="/sortiment/bier" replace/>}/>
          <Route path="/sortiment/:categorySlug" element={<Category />}/>
          <Route path="/sortiment/:categorySlug/:productId" element={<Product />}/>
          
          
          <Route path="/bier" element={<Category category="bier" />} /> 
          <Route path="/wein" element={<Category category="wein" />} />
          <Route path="/schnaps" element={<Category category="schnaps" />} />
          <Route path="/:category/:productName"  element={<Product />} />

        </Routes>
        <Footer></Footer>
      </BrowserRouter>
    </>
  );
}

export default App;