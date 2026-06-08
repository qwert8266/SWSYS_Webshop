import React from "react";
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import ProtectedRoutes from "./routes/protectedRoutes";

import CookieBanner from "./components/cookie_banner";
import Register from "./pages/register";
import Login from "./pages/login"
import Navbar from './components/navbar';
import HideNavbar from './components/hideNavbar';
import Footer from "./components/footer";
import ShoppingCart from './pages/shoppingCart';
import AccountSettings from "./pages/accountSettings";
import Category from "./pages/categories";
import {biere, weine,schnäpse, top_banners } from "./pages/categories"
import Product from "./pages/product";
import {produkte} from "./pages/product";
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
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />}/>
          <Route path="/cart" element={<ShoppingCart />} />
          <Route path="account-settings" element={
            <ProtectedRoutes>
              <AccountSettings/>
            </ProtectedRoutes>
            }
          />
          <Route path="/bier" element={<Category key="bier" products={biere} banner={top_banners[0]} category={"bier"}/>} />
          <Route path="/wein" element={<Category key="wein" products={weine} banner={top_banners[1]} category={"wein"}/>} />
          <Route path="/schnaps" element={<Category key="schnaps" products={schnäpse} banner={top_banners[2]} category={"schnaps"}/>} />
          <Route path="/:category/:productName"  element={<Product />} />
          {/*<Route path="/test" element={<Test/>} /> */}

        </Routes>
        <Footer></Footer>
      </BrowserRouter>
    </>
  );
}

export default App;