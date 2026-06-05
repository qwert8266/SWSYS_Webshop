import React, { Children, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const HideNavbar = ({ children }) => {

  const location = useLocation();
  const [showNavbar, setShowNavbar] = useState(false)

  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/register') {
        setShowNavbar(false)
    } else {
      setShowNavbar(true)
    }
  }, [location])

  return (
    <div>{showNavbar && children}</div>
  )
}

export default HideNavbar