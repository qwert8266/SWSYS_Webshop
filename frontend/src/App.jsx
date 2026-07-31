import React from "react";
import { BrowserRouter, Routes, Route} from "react-router-dom";
import SearchResults from "./pages/searchResults";
import './App.css';

import ProtectedRoutes from "./routes/protectedRoutes";

import LogisticsPanel from "./pages/employee_pages/logisticsPanel";
import ProductManagement from "./pages/employee_pages/product_management";
import OrderManagement from "./pages/employee_pages/order_management";
import Statistics from "./pages/employee_pages/statistics";

import FourOFour from "./pages/404";
import CookieBanner from "./components/cookie_banner";
import Register from "./pages/register";
import Login from "./pages/login";
import ForgotPassword from "./pages/forgotPassword";
import ResetPassword from "./pages/resetPassword";
import Navbar from './components/navbar';
import HideNavbar from './components/hideNavbar';
import Footer from "./components/footer";
import ShoppingCart from './pages/shoppingCart';
import Checkout from "./pages/checkout";
import AccountSettings from "./pages/accountSettings";
import Contact from "./pages/contact";
import Category from "./pages/categories";
import Sortiment from "./pages/sortiment";
import Product from "./pages/product";
import Home from './pages/home';
import Agb from "./pages/agb";
import Datenschutz from "./pages/datenschutz";
import Nutzungsbedingungen from "./pages/nutzungsbedingungen";
import Impressum from "./pages/impressum";

function App() {
  return (
    <>
      <BrowserRouter>
        <HideNavbar>
          <Navbar />
        </HideNavbar>
        <CookieBanner/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/suche" element={<SearchResults />}/>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />}/>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/cart" element={<ShoppingCart />} />
          <Route path="/contact" element={<Contact/>}/>
          <Route path="/agb" element={<Agb />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutzerklärung" element={<Datenschutz />} />
          <Route path="/nutzungsbedingungen" element={<Nutzungsbedingungen />} />
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

         <Route path="/logistik" element={
  <ProtectedRoutes>
    <LogisticsPanel/>
  </ProtectedRoutes>
}/>
<Route path="product_management" element={
  <ProtectedRoutes>
    <ProductManagement/>
  </ProtectedRoutes>
}/>
<Route path="order_management" element={
  <ProtectedRoutes>
    <OrderManagement/>
  </ProtectedRoutes>
}/>
<Route path="statistics" element={
  <ProtectedRoutes>
    <Statistics/>
  </ProtectedRoutes>
}/>

          
          <Route path="/sortiment" element={<Sortiment />}/>
          <Route path="/sortiment/:categorySlug" element={<Category />}/>
          <Route path="/sortiment/:categorySlug/:productId" element={<Product />}/>
          
          
          <Route path="/bier" element={<Category category="bier" />} /> 
          <Route path="/wein" element={<Category category="wein" />} />
          <Route path="/schnaps" element={<Category category="schnaps" />} />
          <Route path="/:category/:productName"  element={<Product />} />
          
          <Route path="*" element={<FourOFour />}/>

        </Routes>
        <Footer></Footer>
      </BrowserRouter>
    </>
  );
}

export default App;