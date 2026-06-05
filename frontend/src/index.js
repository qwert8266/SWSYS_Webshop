import React from "react";
import { createRoot } from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.js";

import App from './App';
import { CartProvider } from "./context/cartContext";

const root = createRoot(document.getElementById("root"));

root.render(
  
  <CartProvider>
    <App />
  </CartProvider>
);