import { React, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";
import { CATEGORY_CONFIGS } from "../utils/categoryConfig";
import productApi from '../api/productApi';
import { getCategoryConfig } from '../utils/categoryConfig';
import {
  formatEuro,
  getProductImagePath,
  normalizeProduct
} from "../utils/productHelpers";
import "../custom.scss";

import './navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const { totalQuantity } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const searchWrapperRef = useRef(null);

  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let ignoreResult = false;

    const timeoutId = setTimeout(async () => {
      setIsSuggestionsLoading(true);

      try {
        const foundProducts = await productApi.searchProducts(query);

        if (!ignoreResult) {
          setSuggestions(foundProducts.map(normalizeProduct).slice(0, 5));
          setShowSuggestions(true);
        }
      } catch (error) {
        if (!ignoreResult) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (!ignoreResult) {
          setIsSuggestionsLoading(false);
        }
      }
    }, 300);

    return () => {
      ignoreResult = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);



function handleSearchSubmit(event) {
  event.preventDefault();

  const query = searchQuery.trim();

  if (query.length < 2) {
    return;
  }
  
  setShowSuggestions(false);
  navigate(`/suche?q=${encodeURIComponent(query)}`);
}

function handleSuggestionClick(product) {
  const category = getCategoryConfig(product.category);

  setSearchQuery("");
  setSuggestions([]);
  setShowSuggestions(false);

  navigate(
    `/sortiment/${category.slug}/${encodeURIComponent(product.id)}`
  );
}

function handleShowAllResults() {
  const query = searchQuery.trim();

  if (query.length < 2) {
    return;
  }

  setShowSuggestions(false);
  navigate(`/suche?q=${encodeURIComponent(query)}`);
}

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
          <div className="navbar-search-shadow" ref={searchWrapperRef}>
          <form
            className="navbar-search"
            role="search"
            onSubmit={handleSearchSubmit}
          >
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <div className="search-suggestions">
                {isSuggestionsLoading && (
                  <div className="search-suggestion-info">
                    Suche läuft …
                  </div>
                )}

                {!isSuggestionsLoading && suggestions.length === 0 && (
                  <div className="search-suggestion-info">
                    Keine Vorschläge gefunden
                  </div>
                )}

                {!isSuggestionsLoading &&
                  suggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="search-suggestion-item"
                      onMouseDown={() => handleSuggestionClick(product)}
                    >
                      <img
                        className="search-suggestion-image"
                        src={getProductImagePath(product)}
                        alt={product.name}
                      />

                      <div className="search-suggestion-content">
                        <span className="search-suggestion-name">
                          {product.name}
                        </span>

                        <span className="search-suggestion-meta">
                          {product.category}
                        </span>
                      </div>

                      <strong className="search-suggestion-price">
                        {formatEuro(product.price)}
                      </strong>
                    </button>
                  ))}

                {!isSuggestionsLoading && suggestions.length > 0 && (
                  <button
                    type="button"
                    className="search-suggestion-all"
                    onMouseDown={handleShowAllResults}
                  >
                    Alle Ergebnisse für „{searchQuery.trim()}“ anzeigen
                  </button>
                )}
              </div>
            )}
            <input
              className="navbar-search-input form-control"
              type="search"
              placeholder="Produkt, Artikelnummer, Hersteller, ..."
              aria-label='Suchleiste'
              value={searchQuery}
              onChange={(event)=> setSearchQuery(event.target.value)}
            />

            <button
              className="btn btn-logoBlue navbar-search-btn"
              type="submit"
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
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;