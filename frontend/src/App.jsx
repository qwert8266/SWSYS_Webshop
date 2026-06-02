import react from 'react';
import { useState } from "react";
import Footer from "./Footer";
import { Routes, Route } from 'react-router-dom';

import Register from "./pages/register";

function App()
{
  return (
    <>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
      <Footer></Footer>
    </>
  );
}

export default App;


