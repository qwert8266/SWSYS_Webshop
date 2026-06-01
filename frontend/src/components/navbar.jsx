import { React, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import "../custom.scss";

import './navbar.css';

function Navbar() {

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isSearchOpen &&
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }

  }, [isSearchOpen]);

  function handleSearchButtonClick(event) {
    if (!isSearchOpen) {
      event.preventDefault();
      setIsSearchOpen(true);
    }
  }


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
        
        {/* Suchleiste */}
        <div className="navbar-elements-right">
          <div className="navbar-search-shadow">
          <form
            ref={searchRef}
            className={`navbar-search ${isSearchOpen ? "navbar-search-open" : ""}`}
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
          <div className="collapse navbar-collapse" id="navbarContent">  {/*justify-content-end*/}
            <ul className="navbar-nav mb-2 mb-lg-0 me-4">
              <li className="nav-item">
                <NavLink className="nav-link active" to="/">
                  Home  
                </NavLink>
              </li>
              
              <li className='nav-item'>
                <NavLink className="nav-link" to="/">
                  Sortiment
                </NavLink>
              </li>
              
              <li className='nav-item'>
                <NavLink className="nav-link" to="/">
                  placeholder
                </NavLink>
              </li>
              
              <li className='nav-item'>
                <NavLink className="nav-link" to="/">
                  Kontakt
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
              //onClick={}    /*TODO: {handleAccountClick} */
              //title={}      /*TODO: Authentifiziert ? "Mein Account" : "Anmelden" */
              aria-label=''   /*TODO: Authentifiziert ? "Accounteinstellungen" : "Zur Anmeldung" */
            >
              <img
                className="navbar-icon"
                src="/img/account-icon.svg"
                alt="account icon"
              />
            </NavLink>

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
              {/*TODO: Anzahl Produkte im Warenkorb */}
            </NavLink>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;