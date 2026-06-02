import react from 'react';
import { Routes, Route } from 'react-router-dom';

import Register from "./pages/register";

function App()
{
  return (
    <>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
}

export default App;