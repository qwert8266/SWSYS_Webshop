import { useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
//import { useAuth } from "../context/authContext";

import "./accountSettings.css";


const exampleOrders = [
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
]


function AccountSettings() {
  const navigate = useNavigate();
  //const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("account");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState("authenticator");
  const [phoneNumber, setPhoneNumber] = useState("");

 // const userInitial = useMemo(() => {
 //   return user?.email?.trim()?.charAt(0)?.toUpperCase() || "U";
 // }, [user?.email]);

 // function handleLogout() {
 //   logout();
 //   navigate("/logout");
 // }
  
  return (
    <main className="page account-page">
      <section className="account-banner">
        <div className="account-avatar" aria-hidden="true">
          {/*userInitial*/}
        </div>

        <div>
          <p className="account-title">Mein Konto</p>
          <h1>Willkommen zurück</h1>
          <p className="account-subtitle">
            Angemeldeter Benutzer
            {/* {user?.email || "Angemeldeter Benutzer"} */}
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
            //onClick={handleLogout}
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
                  <b >Privat-/Unternehmenskonto</b>
                </article>
                <article className="account-info-box">
                  <span className='small-padding'>E-Mail-Adresse</span>
                  Keine E-Mail hinterlegt
                  <b>{/*user?.email || "Keine E-Mail hinterlegt"*/}</b>
                </article>
                <article className="account-info-box">
                  <span className='small-padding'>Bestellungen</span>
                  <b>{exampleOrders.length} Bestellungen</b>
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
                <span className="account-badge">{exampleOrders.length} Bestellungen</span>
              </div>

              <div className="orders-list">
                {exampleOrders.map((order) => (
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
                            <span className="item-text">{order.order_date} · </span>
                            <span className="item-text-label">Bestellnummer: </span>
                            <span className="item-text">{order.id} · </span>
                            <span className="item-text-label">Gesamtbetrag: </span>
                            <span className="item-text"><b>{order.total}</b></span>
                          </span>
                        </span>
                      </span>
                    </section>
                    <article className="order-item" key={order.id}>
                      <div>
                        <b>Bestellung {order.id}</b>
                        <p>{order.items} · {order.date}</p>
                      </div>
                      <div className="order-details">
                        {/*<span>{order.status}</span>
                        <b>{order.total}</b>*/}
                      </div>
                      <button className="btn btn-outline-primary" type="button">
                        Details
                      </button>
                    </article>
                  </div>
                ))}
              </div>
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