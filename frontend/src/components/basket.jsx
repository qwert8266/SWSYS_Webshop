import { Link } from 'react-router-dom';
import { useCart } from "../context/cartContext";


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
      <section className="cart-card empty-cart">
        <h1>Warenkorb</h1>
        <p>Dein warenkorb ist noch leer.</p>
        <Link className="btn btn-primary" to="/sortiment">
          Produkte ansehen
        </Link>
      </section>
    );
  }

  
  return (
    <section className="cart-layout" aria-label="Warenkorb">
      <h4>Warenkorb</h4>
        {/*TODO: Warenkorb stylen */}
    </section>
  );
}

export default ShoppingCart;