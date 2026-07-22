import { Link, NavLink } from 'react-router-dom';
import { useCart } from "../context/cartContext";
import { useStockMap } from "../hooks/useStockMap";
import { formatEuro, getCartItemPricing, getVariantLabel } from '../utils/productHelpers';
import OfferBadge from './offerBadge';
import ProductPrice from './productPrice';
import { getProductImagePath } from '../utils/productHelpers';

function ShoppingCart() {
  
  const {
    items,
    totalQuantity,
    totalProductPrice,
    totalDeposit,
    totalPrice,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const stockMap = useStockMap();

  if (items.length === 0) {
    return (
      <section className="container-xl my-4">
        <div className="row g-4">
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
      <div className="row g-4">
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

            <div className="d-grid gap-3">
              {items.map((item) => {
                const availableStock = 
                  item.selectedVariant?.stock ?? stockMap[item.id]?.stock;
                const isAtStockLimit =
                  Number.isFinite(availableStock) && item.quantity >= availableStock;
                const pricing = getCartItemPricing(item);

                return (
                <article 
                  className="d-flex flex-column flex-md-row align-items-md-center gap-3 p-3 rounded-4 bg-light" 
                  key={item.cartKey}
                >
                  <img
                    className="rounded-3 object-fit-contain flex-shrink-0" 
                    src={getProductImagePath(item)} alt={item.name} 
                    style={{ width: "95px", height: "95px"}}
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
                      {item.deposit > 0 && (
                        <span className="text-muted">
                          {" "}zzgl. {formatEuro(pricing.depositUnitPrice)} Pfand je Einheit
                        </span>
                      )}
                    </span>

                    {/* Hinweis, wenn der Bestand die Warenkorbmenge nicht mehr deckt */}
                    {Number.isFinite(availableStock) && item.quantity > availableStock && (
                      <p className="text-danger mb-0 small">
                        Nur noch {availableStock} verfügbar – bitte Menge anpassen.
                      </p>
                    )}
                  </div>
                  
                  {/* Buttons für Menge anpassen */}
                  <div
                    className="d-flex align-items-center gap-2 justify-content-center flex-shrink-0"
                    style={{ width: "115px" }}
                    aria-label={`Menge für ${item.name}`}    
                  >
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      type="button"
                      onClick={() => decreaseQuantity(item.cartKey)}
                      aria-label="Menge verringern"
                    >
                      -
                    </button>
                    <strong>{item.quantity}</strong>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      type="button"
                      onClick={() => increaseQuantity(item.cartKey, availableStock)}
                      disabled={isAtStockLimit}
                      title={isAtStockLimit ? `Maximal ${availableStock} Stück verfügbar` : undefined}
                      aria-label="Menge erhöhen"
                    >
                      +
                    </button>
                  </div>

                  <strong 
                    className="text-nowrap text-end flex-shrink-0" 
                    style={{ width: "85px"}}
                  >
                    {formatEuro(pricing.totalPrice)}
                  </strong>

                  <button
                    className="btn p-2 border-0 bg-transparent flex-shrink-0  cart-delete-button"
                    type="button"
                    onClick={() => removeItem(item.cartKey)}
                  >
                    <img
                      src="/img/trash.svg"
                      className='cart-delete-icon'
                      alt="delete"
                    />
                  </button>
                </article>
                );
              })}   
            </div>
          </div> 
        </div>

        <aside className="col-12 col-lg-4">
            <div className="card border rounded-4 shadow-sm p-4 bg-white sticky-lg-top">
              <h2 className='h4 mb-3'>Bestellübersicht</h2>

              <div className='d-flex justify-content-between gap-3 py-2 border-bottom'>
                <span>Artikel</span>
                <strong>{totalQuantity}</strong>
              </div>

              <div className='d-flex justify-content-between gap-3 py-2 border-bottom'>
                <span>Zwischensumme</span>
                <strong>{formatEuro(totalProductPrice)}</strong>
              </div>

              <div className='d-flex justify-content-between gap-3 py-2 border-bottom'>
                <span>Pfand</span>
                <strong>{formatEuro(totalDeposit)}</strong>
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
  );
}

export default ShoppingCart;
