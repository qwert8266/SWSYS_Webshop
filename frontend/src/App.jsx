import React from "react";
import { BrowserRouter } from "react-router-dom";

import Navbar from './components/navbar';
import Home from './pages/home';

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Home />
      </BrowserRouter>
    </>
  );
}

export default App;