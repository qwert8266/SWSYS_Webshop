import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useProductLists } from "../context/productListsContext";

import authApi from '../api/authApi';
import orderApi from '../api/orderApi';
import listApi from '../api/listApi';
import productApi from '../api/productApi';
import ProductGrid from '../components/productGrid';
import { getPurchasedProductIds } from '../utils/orderHelpers';
import { formatEuro, normalizeProduct } from '../utils/productHelpers';

import "./accountSettings.css";

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

function getOrderAddress(order) {
  const address =
    order?.shippingAddress ||
    order?.deliveryAddress ||
    order?.address;

  if (!address) {
    return null;
  }

  const street = [
    address.street,
    address.houseNumber || address.house_number,
  ]
    .filter(Boolean)
    .join(" ");

  const city = [
    address.zipCode || address.postalCode || address.zip,
    address.city,
  ]
    .filter(Boolean)
    .join(" ");

  const country = address.country;

  return {
    street,
    city,
    country,
  };
}

function AccountSettings() {
  const [returnOrderId, setReturnOrderId] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnMessage, setReturnMessage] = useState("");
  const [returnItems, setReturnItems] = useState({});
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [returnStatus, setReturnStatus] = useState(null);

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
  
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    repeatNewPassword: "",
  });


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

  const favoriteIdsKey = favoriteIds.join(",");
  const wishlistIdsKey = wishlistIds.join(",");

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
  }, [accessToken, activeSection, favoriteIdsKey, wishlistIdsKey]);

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

  function handlePasswordInputChange(event) {
    const { name, value } = event.target;

    setPasswordForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setPasswordError("");
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    const currentPassword = passwordForm.currentPassword;
    const newPassword = passwordForm.newPassword;
    const repeatNewPassword = passwordForm.repeatNewPassword;

    //## Excaption handling ##//
    if (!currentPassword || !newPassword || !repeatNewPassword) {
      setPasswordError("Bitte fülle alle Passwortfelder aus.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("Das neue Passwort muss sich von aktuellen Passwort unterscheiden.");
      return;
    }

    if (newPassword !== repeatNewPassword) {
      setPasswordError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }

    setPasswordError("");
    
    try {
      const response = await authApi.changePassword(accessToken, {currentPassword, newPassword});

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        repeatNewPassword: "",
      })
      setPasswordSuccess(response?.message || "Passwort wurde erfolgreich geändert.");
    } catch (error) {
      setPasswordError(error.message || "Passwort konnte nicht geändert werden.");
    } 

  }

  /** Erstellt einen stabilen Schlüssel für eine Bestellposition */
  function getOrderItemKey(item) {
    const productId = item.product_id ?? item.productId;
    const volume = Number(item.volume ?? 0);
    const packSize = Number(item.packSize ?? item.pack_size ?? 0);
    
    return `${productId}-${volume}-${packSize}`;
  }

  function openReturnForm(order) {
    const initialReturnItems = {};

    const orderItems = Array.isArray(order.items) ? order.items : [];
    orderItems.forEach((item) => {
      const itemId = getOrderItemKey(item);

      initialReturnItems[itemId] = {
        selected: true,
        quantity: 1,
        maxQuantity: Number(item.quantity || 1),
        name: item.name || "Produkt",
        productId: item.product_id || item.productId,
      };
    });

    setReturnOrderId(order.orderId);
    setReturnItems(initialReturnItems);
    setReturnReason("");
    setReturnMessage("");
    setReturnStatus(null);
  }

  function closeReturnForm() {
    setReturnOrderId(null);
    setReturnItems({});
    setReturnReason("");
    setReturnMessage("");
    setReturnStatus(null);
  }

  function toggleReturnItem(itemId) {
    setReturnItems((currentItems) => ({
      ...currentItems,
      [itemId]: {
        ...currentItems[itemId],
        selected: !currentItems[itemId].selected,
      },
    }));
  }

  function changeReturnQuantity(itemId, quantity) {
    setReturnItems((currentItems) => {
      const currentItem = currentItems[itemId];

      if (!currentItem) {
        return currentItems;
      }

      const maxQuantity = currentItem.maxQuantity;
      const safeQuantity = Math.min(
        Math.max(Number(quantity || 1), 1),
        maxQuantity
      );

      return {
        ...currentItems,
        [itemId]: {
          ...currentItem,
          quantity: safeQuantity,
        },
      };
    });
  }

  async function handleReturnSubmit(event, order) {
    event.preventDefault();

    const selectedItems = Object.entries(returnItems)
      .filter(([, item]) => item.selected)
      .map(([, item]) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
      }));

    if (selectedItems.length === 0) {
      setReturnStatus({
        type: "error",
        message: "Bitte wähle mindestens einen Artikel für die Rücksendung aus.",
      });
      return;
    }

    if (!returnReason) {
      setReturnStatus({
        type: "error",
        message: "Bitte wähle einen Grund für die Rücksendung aus.",
      });
      return;
    }

    try {
      const updatedOrder = await orderApi.requestReturn(
        order.orderId,
        {
          reason: returnReason,
          message: returnMessage,
          items: selectedItems,
        },
        accessToken
      );

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.orderId === updatedOrder.orderId
            ? updatedOrder
            : currentOrder
        )
      );

      setReturnStatus({
        type: "success",
        message: "Die Rücksendung wurde beantragt.",
      });
    } catch (error) {
      setReturnStatus({
        type: "error",
        message: error.message || "Rücksendung konnte nicht beantragt werden.",
      });
    }
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
        
        {/* Navigationsleiste Links */}
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
          {/* Kontoinformationen */}
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

          {/* Lieblingsprodukte */}
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

          {/* Wunschzettel */}
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

          {/* Bestellungen */}
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
                  const address = getOrderAddress(order);
                  const orderId = order?.orderId;
                  const items = Array.isArray(order.items) ? order.items : [];

                  return (
                    <div className="order-card" key={orderId}>
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
                          <p>{order?.items.reduce((sum, item) => sum + Number(item.quantity || 0),0)} Artikel</p>
                          {items.length > 0 && (
                            <ul className='order-products'>
                              {items.map((item) => (
                                <li key={getOrderItemKey(item)}>
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
                        <button className="btn btn-outline-primary"
                          type="button"
                          onClick={() =>
                            setExpandedOrderId((currentId) =>
                              currentId === orderId ? null : orderId
                            )
                          }
                        >
                          {expandedOrderId === orderId ? "Schließen" : "Details & Rücksendung"}
                        </button>
                      </article>
                      {expandedOrderId === orderId && (
                      <div className="order-expanded-details">
                        <h4>Bestelldetails</h4>

                        <p>
                          <strong>Bestellnummer:</strong> {orderId}
                        </p>

                        <p>
                          <strong>Status:</strong> {order.status}
                        </p>

                        <p>
                          <strong>Gesamtpreis:</strong>{" "}
                          {formatEuro(order.totalPrice / 100)}
                        </p>

                        <h5>Produkte</h5>

                        {items.map((item) => (
                          <div
                            key={getOrderItemKey}
                            className="order-detail-product"
                          >
                            <span>
                              {item.quantity}x {item.name || "Produkt"}
                            </span>

                            <span>
                              Einzelpreis: {formatEuro(item.unitPrice / 100)}
                            </span>

                            <span>
                              Pfand: {formatEuro(item.depositPerUnit / 100)}
                            </span>

                            <strong>
                              Gesamt: {formatEuro(item.lineTotalPrice / 100)}
                            </strong>
                          </div>
                        ))}
                        <h5>Lieferadresse</h5>
                          {address ? (
                            <div className="order-detail-address">
                              {address.street && <p>{address.street}</p>}
                              {address.city && <p>{address.city}</p>}
                              {address.country && <p>{address.country}</p>}
                            </div>
                          ) : (
                            <p className="text-muted">
                              Keine Lieferadresse hinterlegt.
                            </p>
                          )}
                          <button
                            className="btn btn-outline-danger"
                            type="button"
                            onClick={() => openReturnForm(order)}
                          >
                            Rücksendung anfordern
                        </button>
                        {returnOrderId === orderId && (
                          <form
                            className="return-form"
                            onSubmit={(event) => handleReturnSubmit(event, order)}
                          >
                            <h5>Rücksendung beantragen</h5>

                            <p className="return-form-hint">
                              Wähle aus, welche Artikel du zurücksenden möchtest.
                            </p>

                            <div className="return-items">
                              {items.map((item) => {
                                const itemId = getOrderItemKey(item);
                                const returnItem = returnItems[itemId];

                                if (!returnItem) {
                                  return null;
                                }

                                return (
                                  <div className="return-item" key={itemId}>
                                    <label className="return-item-main">
                                      <input
                                        type="checkbox"
                                        checked={returnItem.selected}
                                        onChange={() => toggleReturnItem(itemId)}
                                      />

                                      <span>
                                        <strong>{item.name || "Produkt"}</strong>
                                        <small>
                                          Bestellt: {item.quantity} Stück
                                        </small>
                                      </span>
                                    </label>

                                    <label className="return-quantity">
                                      Menge
                                      <select
                                        value={returnItem.quantity}
                                        disabled={!returnItem.selected}
                                        onChange={(event) =>
                                          changeReturnQuantity(itemId, event.target.value)
                                        }
                                      >
                                        {Array.from(
                                          { length: Number(item.quantity || 1) },
                                          (_, quantityIndex) => quantityIndex + 1
                                        ).map((quantity) => (
                                          <option key={quantity} value={quantity}>
                                            {quantity}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>
                                );
                              })}
                            </div>

                            <label className="return-form-label">
                              Grund der Rücksendung
                              <select
                                value={returnReason}
                                onChange={(event) => setReturnReason(event.target.value)}
                              >
                                <option value="">Bitte auswählen</option>
                                <option value="Falscher Artikel">Falscher Artikel</option>
                                <option value="Beschädigt">Beschädigt</option>
                                <option value="Zu viel bestellt">Zu viel bestellt</option>
                                <option value="Gefällt mir nicht">Gefällt mir nicht</option>
                                <option value="Sonstiges">Sonstiges</option>
                              </select>
                            </label>

                            <label className="return-form-label">
                              Nachricht
                              <textarea
                                value={returnMessage}
                                onChange={(event) => setReturnMessage(event.target.value)}
                                placeholder="Beschreibe kurz dein Anliegen..."
                                rows={4}
                              />
                            </label>

                            {returnStatus && (
                              <p className={`return-message ${returnStatus.type}`}>
                                {returnStatus.message}
                              </p>
                            )}

                            <div className="return-form-actions">
                              <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={closeReturnForm}
                              >
                                Abbrechen
                              </button>

                              <button className="btn btn-danger" type="submit">
                                Rücksendung absenden
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            )}
            </section>
          )}

          {/* Kontoeinstellungen */}
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
                  Hier kannst du deine Kontodaten aktualisieren  
                </p>

                <div className="settings-grid">
                  <label>
                    Lieferadresse
                  </label>
                  <p></p>
                  <p>
                    "{user?.address.street} {user?.address.houseNumber}, {user?.address.zipCode} {user?.address.city}, {user?.address.country}"
                  </p>
                  <button
                    className='btn text-primary w-25'
                  >
                    ändern
                  </button>
                  
                  
                  <label>
                    Neue E-Mail-Adresse 
                    <input type="email" value={user?.email || ""} />
                  </label>
                </div>
                  
                <div className='settings-section'>
                  <div className='account-card-header compact border-top pt-3 border-bottom-0'>
                    <div>
                      <h3>Passwort ändern</h3>
                      <p className='account-info-text'>
                        Gib zuerst dein aktuelles Passwort ein und lege dann ein neues fest.
                      </p>
                    </div>
                  </div>

                  <form className='settings-form' onSubmit={handlePasswordSubmit}>
                    <div className='settings-grid'>
                      <label>
                        Aktuelles Passwort 
                        <input 
                          autoComplete='current-password'
                          name="currentPassword"
                          type="password"
                          onChange={handlePasswordInputChange}
                          value={passwordForm.currentPassword} 
                          placeholder='Aktuelles Passwort' 
                        />
                      </label>

                      <label/>

                      <label>
                        Neues Passwort 
                        <input 
                          autoComplete='new-password'
                          name="newPassword"
                          type="password" 
                          onChange={handlePasswordInputChange}
                          value={passwordForm.newPassword}
                          placeholder='Neues Passwort' 
                        />
                      </label>

                      <label>
                        Neues Passwort bestätigen 
                        <input 
                          autoComplete='new-password'
                          name="repeatNewPassword"
                          type="password"
                          onChange={handlePasswordInputChange}
                          value={passwordForm.repeatNewPassword}
                          placeholder='Passwort wiederholen' 
                        />
                      </label>
                    </div>

                    {passwordError && <p className='form-message error text-danger'>{passwordError}</p>}
                    {passwordSuccess && <p className='form-message text-success'>{passwordSuccess}</p>}

                    <div className='settings-action'>
                      <button className='btn btn-primary' type="submit">
                        Password ändern
                      </button>
                    </div>


                  </form>
                </div>

                <div className="settings-section security-settings">
                  <div className="account-card-header compact border-top pt-3 mt-4 border-bottom-0">
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
                          onChange={() => setTwoFactorMethod("authenticator")}
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
                          onChange={() => setTwoFactorMethod("sms")}
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