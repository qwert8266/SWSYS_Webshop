import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useProductLists } from "../context/productListsContext";

import "./accountSettings.css";
import orderApi from '../api/orderApi';
import listApi from '../api/listApi';
import productApi from '../api/productApi';
import ProductGrid from '../components/productGrid';
import { getPurchasedProductIds } from '../utils/orderHelpers';
import { formatEuro, normalizeProduct } from '../utils/productHelpers';


/*const exampleOrders = [
  {
    id: "XYZ-QVW007",
    order_date: "24.04.2026",
    status: "Zugestellt",
    delivery_date: "10.05.2025",
    total: "89,80 €",
    items: "12 Artikel"
  },
  {
    id: "XYZ-QVW008",
    order_date: "14.04.2026",
    status: "In Bearbeitung",
    delivery_date: "",
    total: "89,80 €",
    items: "1 Artikel"
  },
  {
    id: "XYZ-QVW009",
    order_date: "30.04.2026",
    status: "Versendet",
    delivery_date: "",
    total: "8,80 €",
    items: "12 Artikel"
  }
]*/

function normalizeOrderResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.orders)) {
    return response.orders;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }


  return [];
}


function formatOrderDate(dateString) {
    if(!dateString) { return "Unbekannt"; }

    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
}

function getOrderItemCount(order) {

}

function AccountSettings() {
  const navigate = useNavigate();
  const { user, accessToken, logout } = useAuth();
  const { favoriteIds, wishlistIds } = useProductLists();
  const [activeSection, setActiveSection] = useState("account");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState("authenticator");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [purchaseSuggestions, setPurchaseSuggestions] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsError, setListsError] = useState("");
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const userInitial = useMemo(() => {
    return user?.email?.trim()?.charAt(0)?.toUpperCase() || "U";
  }, [user?.email]);

  useEffect(() => {
    if(!accessToken) { 
      setOrders([]);
      setOrdersError("");
      setOrdersLoading(false);
      return; 
    }
  
    let ignoreResult = false;

    async function loadOrders() {
      setOrdersLoading(true);
      setOrdersError("");

      try {
        const response = await orderApi.getMyOrders(accessToken);
        const loadedOrders = normalizeOrderResponse(response);

        if (!ignoreResult) {
          setOrders(loadedOrders);
        }
      } catch (error) {
        if (!ignoreResult) {
          setOrders([]);
          setOrdersError(error.message || "Bestellungen konnten nicht geladen werden.");
        }
      } finally {
        if (!ignoreResult) {
          setOrdersLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      ignoreResult = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      setFavoriteProducts([]);
      setWishlistProducts([]);
      setListsError("");
      setListsLoading(false);
      return;
    }

    if (!["account", "favorites", "wishlist"].includes(activeSection)) {
      return;
    }

    let ignoreResult = false;

    async function loadLists() {
      setListsLoading(true);
      setListsError("");

      try {
        const [favoritesResponse, wishlistResponse] = await Promise.all([
          listApi.getFavorites(accessToken),
          listApi.getWishlist(accessToken),
        ]);

        if (!ignoreResult) {
          setFavoriteProducts(
            Array.isArray(favoritesResponse)
              ? favoritesResponse.map(normalizeProduct)
              : []
          );
          setWishlistProducts(
            Array.isArray(wishlistResponse)
              ? wishlistResponse.map(normalizeProduct)
              : []
          );
        }
      } catch (error) {
        if (!ignoreResult) {
          setFavoriteProducts([]);
          setWishlistProducts([]);
          setListsError(error.message || "Listen konnten nicht geladen werden.");
        }
      } finally {
        if (!ignoreResult) {
          setListsLoading(false);
        }
      }
    }

    loadLists();

    return () => {
      ignoreResult = true;
    };
  }, [accessToken, activeSection, favoriteIds.join(","), wishlistIds.join(",")]);

  useEffect(() => {
    if (!accessToken || activeSection !== "account" || ordersLoading) {
      return;
    }

    const purchasedProductIds = getPurchasedProductIds(orders);
    if (purchasedProductIds.length === 0) {
      setPurchaseSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    let ignoreResult = false;

    async function loadSuggestions() {
      setSuggestionsLoading(true);

      try {
        const loadedProducts = await Promise.all(
          purchasedProductIds.map(async (productId) => {
            try {
              const product = await productApi.getProductById(productId);
              return normalizeProduct(product);
            } catch {
              return null;
            }
          })
        );

        if (!ignoreResult) {
          setPurchaseSuggestions(loadedProducts.filter(Boolean));
        }
      } finally {
        if (!ignoreResult) {
          setSuggestionsLoading(false);
        }
      }
    }

    loadSuggestions();

    return () => {
      ignoreResult = true;
    };
  }, [accessToken, activeSection, orders, ordersLoading]);


  function handleLogout() {
    logout();
    navigate("/home");
  }
  
  return (
    <main className="page account-page">
      <section className="account-banner">
        <div className="account-avatar" aria-hidden="true">
          {userInitial}
        </div>

        <div>
          <p className="account-title">Mein Konto</p>
          <h1>Willkommen zurück</h1>
          <p className="account-subtitle">
            {user?.email || "Angemeldeter Benutzer"}
          </p>
        </div>
      </section>

      <section className="account-layout" aria-label='Kontobereich'>
        <aside className="account-sidebar">
          <div className="accounte-sidebar-main">
            <button
              className={activeSection === "account" ? "account-nav active" : "account-nav"}
              onClick={() => setActiveSection("account")}
              type="button"
            >
              Konto
            </button>
            <button
              className={activeSection === "orders" ? "account-nav active" : "account-nav"}
              onClick={() => setActiveSection("orders")}
              type="button"
            >
              Bestellungen
            </button>
            <button
              className={activeSection === "favorites" ? "account-nav active" : "account-nav"}
              onClick={() => setActiveSection("favorites")}
              type="button"
            >
              Lieblingsprodukte
            </button>
            <button
              className={activeSection === "wishlist" ? "account-nav active" : "account-nav"}
              onClick={() => setActiveSection("wishlist")}
              type="button"
            >
              Wunschzettel
            </button>
            <button
              className={activeSection === "settings" ? "account-nav active" : "account-nav"}
              onClick={() => setActiveSection("settings")}
              type="button"
            >
              Einstellungen
            </button>
          </div>

          <button
            className="account-nav logout"
            onClick={handleLogout}
            type="button"
          >
            Abmelden
          </button>
        </aside>

        <div className="account-content">
          {activeSection === "account" && (
            <section className="account-card">
              <div className="account-card-header">
                <div>
                  <p className="account-title">Kontoübersicht</p>
                  <h2>Deine Kontoinformationen</h2>
                </div>
              </div>

              <div className="account-overview-grid">
                <article className="account-info-box">
                  <span className='small-padding'>Kundenstatus</span>
                  <b >{user?.customerType === "business" ? "Geschäftskonto" : "Privatkonto"}</b>
                </article>
                <article className="account-info-box">
                  <span className='small-padding'>E-Mail-Adresse</span>
                  <b>{user?.email || "Keine E-Mail hinterlegt"}</b>
                </article>
                <article className="account-info-box">
                  <span className='small-padding'>Bestellungen</span>
                  <b>{orders.length} Bestellungen</b>
                </article>
                <article className="account-info-box">
                  <span className='small-padding'>Lieblingsprodukte</span>
                  <b>{favoriteIds.length} Produkte</b>
                </article>
                <article className="account-info-box">
                  <span className='small-padding'>Wunschzettel</span>
                  <b>{wishlistIds.length} Produkte</b>
                </article>
                <article className="account-info-box">
                  <span className='small-padding'>2FA-Status</span>
                  <b>{twoFactorEnabled ? "Aktiviert" : "Nicht aktiviert"}</b>
                </article>
              </div>

              {listsLoading && <p className="account-section-info">Listen werden geladen...</p>}
              {listsError && <p className="account-section-info text-danger">{listsError}</p>}

              {!listsLoading && !listsError && favoriteProducts.length > 0 && (
                <div className="account-preview-section">
                  <div className="account-card-header compact">
                    <div>
                      <p className="account-title">Lieblingsprodukte</p>
                      <h3>Deine Favoriten</h3>
                    </div>
                    <button
                      className="btn btn-link account-link-button"
                      type="button"
                      onClick={() => setActiveSection("favorites")}
                    >
                      Alle anzeigen
                    </button>
                  </div>
                  <ProductGrid products={favoriteProducts.slice(0, 4)} />
                </div>
              )}

              {!listsLoading && !listsError && wishlistProducts.length > 0 && (
                <div className="account-preview-section">
                  <div className="account-card-header compact">
                    <div>
                      <p className="account-title">Wunschzettel</p>
                      <h3>Deine Wunschliste</h3>
                    </div>
                    <button
                      className="btn btn-link account-link-button"
                      type="button"
                      onClick={() => setActiveSection("wishlist")}
                    >
                      Alle anzeigen
                    </button>
                  </div>
                  <ProductGrid products={wishlistProducts.slice(0, 4)} />
                </div>
              )}

              <div className="account-preview-section">
                <div className="account-card-header compact">
                  <div>
                    <p className="account-title">Empfehlungen</p>
                    <h3>Bereits gekaufte Produkte</h3>
                  </div>
                </div>

                {suggestionsLoading && (
                  <p className="account-section-info">Vorschläge werden geladen...</p>
                )}
                {!suggestionsLoading && purchaseSuggestions.length === 0 && (
                  <p className="account-section-info">
                    Sobald du Bestellungen aufgibst, erscheinen hier deine zuletzt gekauften Produkte.
                  </p>
                )}
                {!suggestionsLoading && purchaseSuggestions.length > 0 && (
                  <ProductGrid products={purchaseSuggestions} />
                )}
              </div>
            </section>

          )}

          {activeSection === "favorites" && (
            <section className="account-card">
              <div className="account-card-header">
                <div>
                  <p className="account-title">Lieblingsprodukte</p>
                  <h2>Deine markierten Favoriten</h2>
                </div>
                <span className="account-badge">{favoriteProducts.length} Produkte</span>
              </div>

              {listsLoading && <p>Produkte werden geladen...</p>}
              {listsError && <p className="text-danger">{listsError}</p>}
              {!listsLoading && !listsError && favoriteProducts.length === 0 && (
                <p>Du hast noch keine Lieblingsprodukte markiert.</p>
              )}
              {!listsLoading && !listsError && favoriteProducts.length > 0 && (
                <ProductGrid products={favoriteProducts} />
              )}
            </section>
          )}

          {activeSection === "wishlist" && (
            <section className="account-card">
              <div className="account-card-header">
                <div>
                  <p className="account-title">Wunschzettel</p>
                  <h2>Produkte auf deiner Wunschliste</h2>
                </div>
                <span className="account-badge">{wishlistProducts.length} Produkte</span>
              </div>

              {listsLoading && <p>Produkte werden geladen...</p>}
              {listsError && <p className="text-danger">{listsError}</p>}
              {!listsLoading && !listsError && wishlistProducts.length === 0 && (
                <p>Dein Wunschzettel ist noch leer.</p>
              )}
              {!listsLoading && !listsError && wishlistProducts.length > 0 && (
                <ProductGrid products={wishlistProducts} />
              )}
            </section>
          )}

          {activeSection === "orders" && (
            <section className="account-card">
              <div className="account-card-header">
                <div>
                  <p className="account-title">Bestellhistorie</p>
                  <h2>Deine letzten Bestellungen</h2>
                </div>
                <span className="account-badge">{orders.length} Bestellungen</span>
              </div>

              {ordersLoading && <p>Bestellungen werden geladen...</p>}
              {ordersError && <p className='text-danger'>{ordersError}</p>}
              {!ordersLoading && !ordersError && orders.length === 0 && (
                <p>Du hast bisher noch Bestellung.</p>
              )}

              {!ordersLoading && !ordersError && orders.length > 0 && (
              <div className="orders-list">
                {orders.map((order) => {
                  const orderId = order?.orderId;
                  const items = Array.isArray(order.items) ? order.items : [];

                  return (
                    <div className="order-card">
                      <section className="order-status-container">
                        <div className="section-notice-image">
                          {/*Ein anderes Icon, je Bestellstatus (Zugestellt, etc.)*/}
                          <svg className="icon" >
                            <use href="info-circle.svg"></use>
                          </svg>
                        </div>
                        <span className="section-notice-main">
                          <span className="primary-Message">
                            {order.status}
                          </span>
                          <span className="secondary-Message">
                            <span className="item-wrapper">
                              <span className="item-text-label">Bestelldatum: </span>
                              <span className="item-text">{formatOrderDate(order.createdAt)} · </span>
                              <span className="item-text-label">Bestellnummer: </span>
                              <span className="item-text">{orderId} · </span>
                              <span className="item-text-label">Gesamtbetrag: </span>
                              <span className="item-text"><b>{formatEuro(order.totalPrice / 100)}</b></span>
                            </span>
                          </span>
                        </span>
                      </section>
                      <article className="order-item" key={order.id}>
                        <div>
                          <b>Bestellung {orderId}</b>
                          {/*<p>{getOrderItemCount(order)}</p>*/}
                          <p>{order?.items.reduce((sum, item) => sum + Number(item.quantity || 0),0)} Artikel</p>
                          {items.length > 0 && (
                            <ul className='order-products'>
                              {items.map((item, index) => (
                                <li key={`${item.product_id || item.productId}-${index}`}>
                                  {item.quantity}x {item.name || "Produkt"}
                                </li>
                              ))}
                            </ul>

                          )}
                        </div>
                        <div className="order-details">
                          <span>{order.status}</span>
                          <b>{order.total}</b>
                        </div>
                        <button className="btn btn-outline-primary" type="button">
                          Details
                        </button>
                      </article>
                    </div>

                  );
                  

                })}
              </div>
            )}
            </section>
          )}

          {activeSection === "settings" && (
            <section className="account-card">
              <div className="account-card-header">
                <div>
                  <p className="account-title">Einstellungen</p>
                  <h2>Konto & Sicherheit</h2>
                </div>
              </div>

              
              <div className="settings-section">
                <h3>Kontoinformationen ändern</h3>
                <p className="account-info-text">
                  Aktualisieren  
                </p>

                <div className="settings-grid">
                  <label>
                    Neue E-Mail-Adresse 
                    <input type="email" defaultValue={/*user?.email ||*/ ""} />
                  </label>

                  <label></label>

                  <label>
                    Aktuelles Passwort 
                    <input type="password" placeholder='Aktuelles Passwort' />
                  </label>
                  <label>
                    Neues Passwort 
                    <input type="password" placeholder='Neues Passwort' />
                  </label>

                  <label></label>

                  <label>
                    Neues Passwort bestätigen 
                    <input type="password" placeholder='Passwort wiederholen' />
                  </label>

                  <button className="btn btn-primary" type="button">
                    Kontoinformationen speichern
                  </button>
                </div>

                <div className="settings-section security-settings">
                  <div className="account-card-header compact">
                    <div>
                      <h3>Sicherheitseinstellungen</h3>
                      <p className="account-info-text">
                        Lege fest, wie dein Konto zusätzlich geschützt werden soll.
                      </p>
                    </div>
                    <span className={twoFactorEnabled ? "account-badge success" : "account-badge"}>
                      {twoFactorEnabled ? "Aktiv" : "Inaktiv"}
                    </span>
                  </div>

                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(event) => setTwoFactorEnabled(event.target.checked)}
                    />
                    2FA für dieses Konto aktivieren
                  </label>

                  {twoFactorEnabled && (
                    <div className="two-factor-options">
                      <label 
                        className={twoFactorMethod === "authenticator" ? 'method-card active' : "method-card"}
                        onClick={() => setTwoFactorMethod("authenticator")}
                      >
                        <input
                          type="radio"
                          name="twoFactorMethod"
                          value="authenticator"
                          checked={twoFactorMethod === "authenticator"}
                          onChanged={() => setTwoFactorMethod("authenticator")}
                        />
                        <span>
                          <b>Authenticator-App</b>
                          <small>Empfohlen, z.B. Google Authenticator, Microsoft Authenticator, 2FA Authenticator oder Authy.</small>
                        </span>
                      </label>

                      <label 
                        className={twoFactorMethod === "sms" ? "method-card active" : "method-card"}
                        onClick={() => setTwoFactorMethod("sms")} 
                      >
                        <input
                          type="radio"
                          name="twoFactorMethod"
                          value="sms"
                          checked={twoFactorMethod === "sms"}
                          onChanged={() => setTwoFactorMethod("sms")}
                        />
                        <span>
                          <b>SMS</b>
                          <small>Ein Einmalcode wird an deine Mobilnummer gesendet.</small>
                        </span>
                      </label>

                      {twoFactorMethod === "sms" && (
                        <label>
                          Mobilnummer
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(event) => setPhoneNumber(event.tarbet.value)}
                            placeholder="+49 170 1234567"
                          />
                        </label>
                      )}

                      {twoFactorMethod === "authenticator" && (
                        <div className="authenticator-box">
                          <b>Einrichtung per Authenticator-App</b> 
                          
                        </div>
                      )}
                    </div> 
                  )}
                </div>
              </div>

              <button className="btn btn-primary" type="button">
                Änderungen speichern
              </button>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

export default AccountSettings;