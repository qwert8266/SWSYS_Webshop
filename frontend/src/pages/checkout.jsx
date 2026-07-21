import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './checkout.css';
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";
import orderApi from '../api/orderApi';
import { formatEuro, getProductImagePath, getVariantLabel, getCartItemPricing } from "../utils/productHelpers";
import OfferBadge from '../components/offerBadge';
import ProductPrice from '../components/productPrice';


/**
 * Erstellt die vorausgefüllten Checkout-Daten aus dem angemeldeten Benutzerkonto  
 */
function buildPersonalData(user) {
  const address = user?.address || {};

  return {
    salutation: user?.salutation || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    street: address?.street || "",
    houseNumber: address?.houseNumber || "",
    zipCode: address?.zipCode || "",
    city: address?.city || "",
    country: address?.country || "Deutschland",
    email: user?.email || "",
    phone: user?.phone || "",
    paymentMethod: "",
  };
}

function Checkout(){
  const { user, accessToken } = useAuth();
  const { 
    items, 
    totalQuantity, 
    totalPrice, 
    totalProductPrice, 
    totalDeposit, 
    clearCart, 
    isCartLoading, 
    cartError 
  } = useCart();

  const [personalData, setPersonalData] = useState(() => buildPersonalData(user));
  const [editData, setEditData] = useState(() => buildPersonalData(user));
  const [showPlaintextBox, setShowPlaintextBox] = useState(true);
  const [showInputBoxes, setShowInputBoxes] = useState(false);
  const [showSuccessfulOrderScreen, setShowSuccessfulOrderScreen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [payPal,setPayPal] = useState(personalData.paymentMethod === "PayPal")
  const [card,setCard] = useState(personalData.paymentMethod === "SEPA-Lastschrift")
  const [rechnung, setRechnung] = useState(personalData.paymentMethod === "Rechnung");

  useEffect(() => {
    const nextPersonalData = buildPersonalData(user);
    setPersonalData(nextPersonalData);
    setEditData(nextPersonalData);
    setPayPal(nextPersonalData.paymentMethod === "PayPal");
    setCard(nextPersonalData.paymentMethod === "SEPA-Lastschrift");
    setRechnung(nextPersonalData.paymentMethod === "Rechnung");
  }, [user]);

  /**
   * Sendet die Bestellung mit den aktuellen Warenkorbposition an das Backend
   * Nach erfolgreicher Bestellug wird der Warenkorb über den CartContext geleert
   */
  async function handlePlaceOrder(selectedPaymentMethod) {
    setSubmitError("");

    if (!accessToken) {
      setSubmitError("Du musst angemeldet sein, um eine Bestellung aufzugeben.");
      return;
    }

    if (items.length === 0) {
      setSubmitError("Der Warenkorb ist leer.");
      return;
    }

    const paymentMethod = selectedPaymentMethod || personalData.paymentMethod || "Rechnung";

    // Für die Bestellung werden nur Produkt-ID und Menge übertragen
    // Preise, Bestand und weitere Produktdaten werden serverseitig geprüft
    const orderData = {
      items: items.map((item) => {
        
        /* Identifiziert die gewählte Produktvariante (Gebindegröße) */
        const packSize = Number(
          item.selectedVariant?.packSize ?? 
          item.selectedVariant?.pack_size ?? 
          item.packSize ?? 
          item.pack_size ?? 
          0
        );
        const volume = Number(
          item.selectedVariant?.volume ?? 
          item.volume ?? 
          0
        );

        return {
          product_id:  item.product_id || item.productId || item.productID || item.id,
          pack_size: packSize,
          volume,
          quantity: Number(item.quantity),
        }
      }),
      address: {
        street: personalData.street,
        houseNumber: personalData.houseNumber,
        zipCode: personalData.zipCode,
        city: personalData.city,
        country: personalData.country,
      },
      paymentMethod,
    };

    try {
      setIsSubmitting(true);
      const order = await orderApi.createOrder(orderData, accessToken);
      setCreatedOrder(order);
      setShowInputBoxes(false);
      setShowPlaintextBox(false);
      setShowSuccessfulOrderScreen(true);
      // Nach Erfolgreicher Bestellung wird auch der backendgespeicherte Warenkorb geleert
      clearCart();

    } catch (error) {
      setSubmitError(error.message || "Die Bestellung konnte nicht abgesendet werden.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCartLoading && items.length === 0) {
    return (
      <div className='successful_order'>
        <label className='success_label'>Warenkorb wird geladen...</label>
      </div>
    );
  }

  // Beim Bezahlen, aber der Warenkorb war leer
  if (items.length === 0 && !showSuccessfulOrderScreen) {
    return (
      <div className="successful_order">
        <label className="success_label">Der Warenkorb ist leer.</label>
        <NavLink to="/home">
          <button className="success_button" type="button">Zurück zu den Produkten</button>
        </NavLink>
      </div>
    );
  }


  return(
    <div>
      <div>
      {!showSuccessfulOrderScreen &&
        <div >
          <label className='blue_text_big'>Nur noch ein paar Klicks entfernt...</label>
            <div className='basic-column'>
              
              <div className='order_details'>
                <div className='btn-back'>
                  <NavLink to="/cart">
                    <button className='btn'>&larr; Zurück zum Warenkorb</button>
                  </NavLink>
                </div>

                {submitError && <p className="text-danger align-items-center">{submitError}</p>}

                {cartError && <p className='text-danger align-items-center'>{cartError}</p>}

                {/* Lieferdaten */}
                {showPlaintextBox &&
                  <div>
                    <div className='plaintextBox'>
                        <label className='blue_text'>Lieferadresse und Zahlungsmethode</label>
                        <label className='more_space'>{personalData.salutation} {personalData.firstName} {personalData.lastName}</label>
                        <label>{personalData.street} {personalData.houseNumber} </label>
                        <label>{personalData.zipCode} {personalData.city}</label>
                        <label className='more_space'>{personalData.country}</label>
                        <label>Email: {personalData.email} </label>
                        <label className='more_space'>Telefonnummer: {personalData.phone} </label>
                        <label>Zahlungsmethode: {personalData.paymentMethod} </label>
                        <label>Versandart: {personalData.delivery} </label>
                    </div>

                    {/* btn Lieferadresse & Kontaktdaten ändern */}
                    <div className='changeDataButtonBox'>
                        <button 
                          className='changeDataButton' 
                          onClick={()=>{setShowInputBoxes(true); setShowPlaintextBox(false); }}
                        >
                          Anpassen
                        </button>
                    </div>

                    {/* btn "Zurück" und "Bestellung aufgeben" */}
                    <div className='button_row'>
                     
                      <button 
                        className='blue_button' 
                        type="button"
                        disabled={isSubmitting}
                        onClick={(e) => {setCard(false); setPayPal(false); setRechnung(true); handlePlaceOrder("Rechnung"); }}
                      >
                        {isSubmitting ? "Bestellung wird gesendet..." : "Jetzt bestellen"}
                      </button>

                      <button 
                        className='btn btn-payment btn-paypal'
                        type="button"
                        disabled={isSubmitting}
                        onClick={(e) => {setCard(false); setPayPal(true); setRechnung(false); handlePlaceOrder("PayPal"); }}
                      >
                        <img src="/img/PayPal.svg" alt="PayPal" />
                      </button>

                      <button 
                        className='btn btn-payment btn-sepa'
                        type="button"
                        disabled={isSubmitting}
                        onClick={(e) => {setCard(true); setPayPal(false); setRechnung(false); handlePlaceOrder("SEPA") }}
                      >
                        <img src="/img/sepa-lastschrift-logo.svg" alt="SEPA Lastschrift" />
                      </button>
                    </div>
                  </div>
                }

                {/* Eingabe Lieferdaten */}
                {showInputBoxes &&
                  <div className='personal_data'>
                    <div className='checkout_header'>
                      <label className='blue_text'>Adressat</label>
                      <div className='checkout_footer'>
                        <select 
                          className='greeting_combo' 
                          value={editData.salutation}
                          onChange={(e)=>setEditData({...editData,salutation: e.target.value})}
                        >
                          <option>Herr</option>
                          <option>Frau</option>
                          <option>Divers</option>
                        </select>
                        <input className='inputs' placeholder='Vorname' value={editData.firstName} onChange={(e)=>setEditData({...editData,firstName:e.target.value})}></input>
                        <input className='inputs' placeholder='Nachname' value={editData.lastName} onChange={(e)=>setEditData({...editData,lastName:e.target.value})}></input>
                      </div>
                    </div>

                    <div className='checkout_header'>
                      <label className='blue_text'>Adresse</label>
                    </div>

                    <div className='checkout_footer'>
                      <input className='inputs' placeholder='Straße' value={editData.street} onChange={(e)=>setEditData({...editData,street:e.target.value})} />
                      <input className='inputs' style={{ width: "80px" }} placeholder='Nr.' value={editData.houseNumber} onChange={(e)=>setEditData({...editData,houseNumber:e.target.value})}></input>
                        
                    </div>

                    <div className='checkout_footer'>
                      <input className="inputs" style={{ width: "80px" }} placeholder='PLZ' value={editData.zipCode} onChange={(e)=>setEditData({...editData,zipCode:e.target.value})}/>
                      <input className='inputs' placeholder='Stadt' value={editData.city} onChange={(e)=>setEditData({...editData,city:e.target.value})}></input>
                      <input className='inputs' placeholder='Land' value={editData.country} onChange={(e)=>setEditData({...editData,country:e.target.value})}></input>
                    </div>
                    
                    {/* Kontaktinformationen */}
                    <div className='checkout_header2'>
                      <label className='blue_text'>Kontaktdaten</label>
                      <div className='checkout_footer'>
                          <label className='medium_text'>Email</label>
                          <input className='inputs' placeholder='Email' value={editData.email} onChange={(e)=>setEditData({...editData,email:e.target.value})}></input>
                      </div>
                      <div className='checkout_footer'>
                          <label className='medium_text'>Telefonnummer</label>
                          <input className='inputs' placeholder='Telefonnummer' value={editData.phone} onChange={(e)=>setEditData({...editData,phone:e.target.value})}></input>
                      </div>
                    </div>

                    <div className='delivery_details'>
                      <label className='blue_text'>Bezahlung und Lieferungsart</label>
                      <div className='pay_method'>
                        <label className='medium_text'>Zahlungsmethode</label>
                        <button 
                          className={card ? "blue_button" : "white_button"} 
                          type="button"
                          value="SEPA" 
                          onClick={(e) => {setEditData({ ...editData, paymentMethod: e.target.value}); setCard(true); setPayPal(false); setRechnung(false) }}
                        >
                          SEPA
                        </button>
                        <button 
                          className={payPal ? "blue_button" : "white_button"} 
                          type="button"
                          value="PayPal"
                          onClick={(e) => {setEditData({ ...editData, paymentMethod: e.target.value}); setCard(false); setPayPal(true); setRechnung(false) }}
                        >
                          Paypal
                        </button>
                        <button 
                          className={rechnung ? "blue_button" : "white_button"} 
                          type="button"
                          value="Rechnung"
                          onClick={(e) => {setEditData({ ...editData, paymentMethod: e.target.value}); setCard(false); setPayPal(false); setRechnung(true) }}
                        >
                          Rechnung
                        </button>
                      </div>

                      <div className='delivery_kind'>
                        <label className='medium_text'>Lieferungsart</label>
                        <select className='delivery_combo ' value={editData.delivery} onChange={(e)=>setEditData({...editData,delivery:e.target.value})}>
                          <option>Standard</option>
                          <option>Premium</option>
                        </select>
                      </div>

                    </div>

                    <div className='button_row'>
                      <button className='white_button' onClick={()=>{setShowInputBoxes(false);setShowPlaintextBox(true)}}>Zurück</button>
                      <button className='blue_button' onClick={()=>{setShowInputBoxes(false);setShowPlaintextBox(true);setPersonalData(editData)}}>Speichern</button>
                    </div>
                  </div>
                }   
              </div>

              {/* Warenkorb  */}
              <div className="card border rounded-4 shadow-sm p-4 bg-white" style={{ minHeight: "520px"}}>
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div>
                    <h1 className="h3 mb-0">Warenkorb</h1>
                  </div>

                  <span className="account-badge">{totalQuantity} Artikel</span>
                </div>

                {/* Warenkorb Produkte */}
                <div className="d-grid gap-3">
                  {items.map((item) => (
                    <article 
                      className="d-flex flex-column flex-md-row align-items-md-center gap-3 p-3 rounded-4 bg-light" 
                      key={item.cartKey}
                    >
                      <img
                        className="rounded-3 object-fit-contain flex-shrink-0" 
                        src={getProductImagePath(item)} //{"/img/product_images/" + item.image} 
                        style={{ width: "95px", height: "95px"}}
                        alt={item.name}
                      />

                      <div className="flex-grow-1">
                        <h5>{item.name}</h5>
                        {(item.selectedVariant?.volume ?? item.volume) > 0 && (
                          <p className="mb-1 text-muted">
                            {getVariantLabel(item.selectedVariant || { 
                              packSize: item.packSize, 
                              volume: item.volume 
                            })}
                          </p>
                        )}

                        <OfferBadge product={item} />
                        <span className="d-block">
                          <ProductPrice product={item} showDiscount={false} />
                          {getCartItemPricing(item).depositUnitPrice > 0 && (
                            <span className="text-muted">
                              {" "}zzgl. {formatEuro(getCartItemPricing(item).depositUnitPrice)} Pfand
                            </span>
                          )}
                        </span>
                      </div>
                      
                      <div
                        className="d-flex align-items-center gap-2 justify-content-center flex-shrink-0"
                        style={{ width: "115px" }}
                        aria-label={`Menge für ${item.name}`}    
                      >
                        <strong>{item.quantity}x</strong>
                      </div>

                      <strong  
                        className="text-nowrap text-end flex-shrink-0" 
                        style={{ width: "85px"}}
                      >
                        {formatEuro(getCartItemPricing(item).totalPrice)}
                      </strong>
                    </article>
                  ))}   
                </div>

                <div className="d-flex justify-content-between gap-3 py-2 border-top mt-3">
                  <span>Zwischensumme</span>
                  <strong>{formatEuro(totalProductPrice)}</strong>
                </div>

                <div className="d-flex justify-content-between gap-3 py-2">
                  <span>Pfand</span>
                  <strong>{formatEuro(totalDeposit)}</strong>
                </div>

                <div className="d-flex justify-content-between gap-3 py-3 border-top">
                  <span>Gesamt</span>
                  <strong>{formatEuro(totalPrice)}</strong>
                </div>
              </div> 
          </div>
        </div>
      }
      </div>
      
      <div>
      {showSuccessfulOrderScreen &&
        <div className='successful_order'>
          <label className='success_label'>Der Durst hat bald ein Ende!</label>
          <label className='success_label_minor'>Ihre Bestellung wird schon bald verschickt.</label>
          <NavLink to="/home">
            <button className='success_button' >Zurück zu den Produkten</button>
          </NavLink>
        </div>
      }
      </div>
    </div>
  )
}

export default Checkout