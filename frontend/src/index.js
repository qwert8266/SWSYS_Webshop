import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";


import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.js"

import App from "./App";
import Register from "./pages/register";


const root = createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
     <App />
  </BrowserRouter>
);