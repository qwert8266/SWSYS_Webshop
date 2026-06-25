import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

import authApi from '../api/authApi';
import orderApi from '../api/orderApi';
import { formatEuro } from '../utils/productHelpers';

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

function getOrderItemCount(order) {

}

function AccountSettings() {
  const navigate = useNavigate();
  const { user, accessToken, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("account");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState("authenticator");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  
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
    //setPasswordSuccess("");
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
                  <span className='small-padding'>2FA-Status</span>
                  <b>{twoFactorEnabled ? "Aktiviert" : "Nicht aktiviert"}</b>
                </article>
              </div>
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
                  Hier kannst du deine Kontodaten aktualisieren  
                </p>

                <div className="settings-grid">
                  <label>
                    Lieferadresse
                  </label>
                  <p></p>
                  <p>
                    "Kleine Gasse 15, 29188 Bremen, Deutschland"
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
                      <h3>Password ändern</h3>
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