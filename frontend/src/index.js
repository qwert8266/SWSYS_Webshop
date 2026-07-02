import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";


import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "bootstrap-icons/font/bootstrap-icons.css"

import App from "./App";

import { CartProvider } from "./context/cartContext";
import { AuthProvider } from "./context/authContext";
import { ProductListsProvider } from "./context/productListsContext";

const root = createRoot(document.getElementById("root"));

root.render(

  <AuthProvider>
    <ProductListsProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </ProductListsProvider>
  </AuthProvider>

);