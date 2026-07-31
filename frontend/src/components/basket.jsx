import { Link, NavLink } from 'react-router-dom';
import { useCart } from "../context/cartContext";
import { formatEuro } from '../utils/productHelpers';



function ShoppingCart() {
  
  /* Ruft den Kontext/Funktionen des Warenkorbs auf */
  const {
    items,
    totalQuantity,
    totalPrice,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  /** Wenn sich noch keine Produkte im Warenkorb befinden */
  if (items.length === 0) {
    return (
      <section className="container-xl my-4">
        <div class="row g-4">
        {/* Linke Seite <Warenkorb-Produkte> */}
          <div className="col-12 col-lg-8">
            <div className="card border rounded-4 shadow-sm p-4 bg-white">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h1>Warenkorb</h1>
                  <p>Dein Warenkorb ist noch leer.</p>
                  <Link className="btn btn-primary" to="/sortiment">
                  Produkte ansehen
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>  
      </section>
    );
  }

  
  return (
     
    <section className="container-xl my-4">
      <div class="row g-4">
        {/* Linke Seite <Warenkorb-Produkte> */}
        <div className="col-12 col-lg-8">
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
                      {formatEuro(item.price)}
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
                    {formatEuro(item.price * item.quantity)}
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

        {/* Rechte Seite - Bestellübersicht */}
        <aside className="col-12 col-lg-4">
            <div className="card border rounded-4 shadow-sm p-4 bg-white sticky-lg-top">
              <h2 className='h4 mb-3'>Bestellübersicht</h2>

              <div className='d-flex justify-content-between gap-3 py-2 border-bottom'>
                <span>Artikel</span>
                <strong>{totalQuantity}</strong>
              </div>

              <div className='d-flex justify-content-between gap-3 py-3 border-bottom'>
                <span>Gesamt</span>
                <strong>
                  {formatEuro(totalPrice)}
                </strong>
              </div>

              <NavLink to="/cart/checkout">
                <button className='btn btn-success w-100 mt-3' type='button'>
                  Zur Kasse
                </button>
              </NavLink>

              <button
                className="btn btn-outline-secondary w-100 mt-2"
                type="button"
                onClick={clearCart}
              >
                Warenkorb leeren
              </button>
            </div>
        </aside>
                         
        
      </div>
    </section>


    /*<section className="cart-layout container py-5 h-100" aria-label="Warenkorb">
      <div className="cart card-registration ">
        <div className="account-card-header">

        <div className="d-flex fustify-content-between align-items-center mb-5"> 
          <h1 className="account-title">Warenkorb</h1>
          <h6 className="mb-0 test-muted account-badge">{totalQuantity} Artikel</h6>

        </div>
        </div>
        <span className="account-badge">{totalQuantity} Artikel</span>        
      </div>
      <hr className='my-4' />

      <div className="cart-items">
        {items.map((item) => (
          <article className="cart-item" key={item.id}>
            
            <div>
              <strong>{item.title}</strong>

            </div>

          </article>
        ))}

      </div>
      


    </section>*/
  );
}

export default ShoppingCart;