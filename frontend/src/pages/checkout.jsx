import { NavLink } from 'react-router-dom';
import './checkout.css';
import { useCart } from "../context/cartContext";


function Checkout(){

    //const {items}=useCart();

    const {
    items,
    totalQuantity,
    totalPrice,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();


    return(
        <div>
            <div className='basic-column'>
                <div className='order_details'>
                    <div className='personal_data'>
                        <div className='checkout_header'>
                            <label className='blue_text'>Adressant</label>
                            <div className='checkout_footer'>
                                <select className='greeting_combo'>
                                    <option>Herr</option>
                                    <option>Frau</option>
                                    <option>Divers</option>
                                </select>
                                <input className='inputs' placeholder='Vorname'></input>
                                <input className='inputs' placeholder='Nachname'></input>
                            </div>
                            
                        </div>
                        <div className='checkout_header'>
                            <label className='blue_text'>Adresse</label>
                        </div>
                        <div className='checkout_footer'>
                            <input className='inputs' placeholder='Straße'></input>
                            <input className='inputs' placeholder='Nr.'></input>
                            <input className='inputs' placeholder='PLZ'></input>
                        </div>
                        <div className='checkout_footer'>
                            <input className='inputs' placeholder='Stadt'></input>
                            <input className='inputs' placeholder='Land'></input>
                        </div>

                        <div className='checkout_header'>
                            <label className='blue_text'>Kontaktdaten</label>
                            <div className='checkout_footer'>
                                <label>Email</label>
                                <input className='inputs' placeholder='Email'></input>
                            </div>
                            <div className='checkout_footer'>
                                <label>Telefonnummer</label>
                                <input className='inputs' placeholder='Telefonnummer'></input>
                            </div>
                        </div>

                        <div className='delivery_details'>
                        <label className='blue_text'>Bezahlung und Lieferungsart</label>
                        <div className='pay_method'>
                            <button className='card_pay'>Karte</button>
                            <button className='paypal'>Paypal</button>
                        </div>
                        <div className='delivery_kind'>
                            <label>Lieferungsart</label>
                            <select className='delivery_combo'>
                                <option>Standard</option>
                                <option>Premium</option>
                            </select>
                        </div>
                        
                        </div>
                    </div>

                    

                    <div className='button_row'>
                        <button className='return_button'>Zurück zum Warenkorb</button>
                        <button className='pay_button'>Jetzt bestellen</button>
                    </div>
                </div>

               <div 
            className="card border rounded-4 shadow-sm p-4 bg-white"
            style={{ minHeight: "520px"}}  
          >
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
                  key={item.id}
                >
                  <img
                    className="rounded-3 object-fit-contain flex-shrink-0" 
                    src={"/img/product_images/" + item.image} alt={item.name} 
                    style={{ width: "95px", height: "95px"}}
                    alt={item.name}
                  />

                  <div className="flex-grow-1">
                    <h5>{item.name}</h5>
                    
                    <span>
                      {item.price.toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}€
                    </span>
                  </div>
                  
                  {/* Buttons für Menge anpassen */}
                  <div
                    className="d-flex align-items-center gap-2 justify-content-center flex-shrink-0"
                    style={{ width: "115px" }}
                    aria-label={`Menge für ${items.name}`}    
                  >
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      type="button"
                      onClick={() => decreaseQuantity(item.id)}
                      aria-label="Menge verringern"
                    >
                      -
                    </button>
                    <strong>{item.quantity}</strong>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      type="button"
                      onClick={() => increaseQuantity(item.id)}
                      aria-label="Menge erhöhen"
                    >
                      +
                    </button>
                  </div>

                  <strong 
                    className="text-nowrap text-end flex-shrink-0" 
                    style={{ width: "55px"}}
                  >
                    {(item.price * item.quantity).toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </strong>

                  <button
                    className="btn p-2 border-0 bg-transparent flex-shrink-0  cart-delete-button"
                    type="button"
                    onClick={() => removeItem(item.id)}
                  >
                    <img
                      src="/img/trash.svg"
                      className='cart-delete-icon'
                    />
                  </button>
                </article>
              ))}   
            </div>
          </div> 
        </div>
        </div>
    )
}

export default Checkout