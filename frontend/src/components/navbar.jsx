import { React, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";
import { CATEGORY_CONFIGS } from "../utils/categoryConfig";
import "../custom.scss";

import './navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const { totalQuantity } = useCart();

  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    const roleInLocalStorage = localStorage.getItem("role");

    if (roleInLocalStorage === "employee") {
        setIsEmployee(true);
    }
}, []);

  function handleSearchButtonClick(event) {
   
  }

  function handleAccountClick() {
    navigate(isAuthenticated ? "/account-settings" : "/login");
  }

  //const location = useLocation();
  const categories = CATEGORY_CONFIGS;

  return (
    <nav className="navbar navbar-expand-md bg-body-tertiary" fixed="top">
      <div className="container-fluid navbar-container">
        {/* Logo */}
        <NavLink className="navbar-brand" to="/">
          <img className="navbar-logo" src="/img/nav_logo.svg" alt="logo" /> 
        </NavLink>

         <button 
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Bedienelemente ausklappen"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        
        <div className="navbar-elements-right">
          {/* Suchleiste */}
          <div className="navbar-search-shadow">
          <form
            className="navbar-search"
            role="search"
          >
            <input
              className="navbar-search-input form-control"
              type="search"
              placeholder="Produkt, Artikelnummer, Hersteller, ..."
              aria-label='Suchleiste'
            />

            <button
              className="btn btn-logoBlue navbar-search-btn"
              type="submit"
              onClick={handleSearchButtonClick}
              aria-label='Suchen'
            >
              <img
                className="navbar-search-icon"
                src="/img/search-icon.svg"
                alt="suchen"
              />
            </button>
          </form>
          </div>

          
          {/* Bedienelemente */}
          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav mb-2 mb-lg-0 gap-2">
              <li className="nav-item">
                <NavLink className="nav-link" to="/home">
                  <a>Home</a>
                </NavLink>
              </li>
              
              <li className='nav-item nav-dropdown'>
                <NavLink 
                  className="nav-link" 
                  to="/sortiment"
                >
                  <a>Sortiment</a>
                </NavLink>

                <div className="nav-dropdown-menu">
                  {categories.map((Category) => (
                    <NavLink
                      key={Category.slug}
                      className="nav-dropdown-link"
                      to={`/sortiment/${Category.slug}`}
                    >
                      <a>{Category.name}</a>
                    </NavLink>
                  ))}
                </div>
              </li>
              
              <li className='nav-item'>
                <NavLink className="nav-link" to="/placeholder">
                  <a>placeholder</a>
                </NavLink>
              </li>
              
              <li className='nav-item'>
                <NavLink className="nav-link" to="/contact">
                  <a>Kontakt</a>
                </NavLink>
              </li>
            </ul>
          </div>


          {/* Navbar icons */}
          <div className="navbar-user-area">
            {/* Account */}
            <NavLink
              type="button"
              className="btn btn-light border navbar-icon-button"
              //onClick={handleAccountClick}  
              to={isAuthenticated ? "/account-settings" : "/login"}
              title={isAuthenticated ? "Mein Account" : "Anmelden"}      
              aria-label={isAuthenticated ? "Accounteinstellungen" : "Zur Anmeldung"}
            >
              <img
                className="navbar-icon"
                src="/img/account-icon.svg"
                alt="account icon"
              />
            </NavLink>

            {/*location.pathname.startsWith("/employee/") ?():()*/}
            {/* Shopping cart */}
            <NavLink
              type="button"
              className="btn btn-light border navbar-icon-button cart-icon-button"
              title="Warenkorb"
              aria-label='Warenkorb anzeigen'
              to="/cart"
            >
              <img
                className="navbar-icon"
                src="/img/cart-icon.png" 
                alt="warenkorb icon"
              />
              {totalQuantity > 0 && <span className="cart-badge">{totalQuantity}</span>}
            </NavLink>

            <div className="dropdown-wrapper">
              <NavLink
                type="button"
                className="btn btn-light border navbar-icon-button cart-icon-button"
                title="Mitarbeiter"
                aria-label='Warenkorb anzeigen'
                to="/cart"
              >
                <img
                  className="navbar-icon"
                  src="/img/hamburger_icon.png" 
                  alt="warenkorb icon"
                />
                {totalQuantity > 0 && <span className="cart-badge">{totalQuantity}</span>}
              </NavLink>

              <div className="dropdown-menu-custom">
                <NavLink to="/product_management">Produktverwaltung</NavLink>
                <NavLink to="/orders">Bestellungen</NavLink>
                <NavLink to="/marketing">Marketing</NavLink>
                <NavLink to="/analysis">Analyse-Dashboard</NavLink>
              </div>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;