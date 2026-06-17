import { createContext, useContext, useEffect, useMemo, useState } from "react";


const CartContext = createContext(null);
const CART_STORAGE_KEY = "schmidt-shoping-cart";


/* Lädt einen ursprünglichen Warenkorb 
 * aus dem localStorage des Browsers. 
*/
function loadInitialCart() {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
  } catch (error) {
    console.warn("Warenkorb konnte nicht geladen werden", error);
    return [];
  }
}


/**
 * Stellt den Warenkorb-Zustand für alle untergeordneten Komponenten bereit.
 */ 
export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitialCart);

  /**
   * Speichert den aktuellen Warenkorb automatisch im localStorage.
   * immer wenn sich [items] ändert.
   */
  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Warenkorb konnte nicht gespeichert werden", error);
    }
  }, [items]);

  /**
   * Fügt ein Produkt dem Warenkorb hinzu
   * ist es schon vorhanden, wird die Menge erhöht 
   */
  function addItem(product) {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);
    
      /* Wenn das Produkt bereits im Warenkorb ist */
      if (existingItem) {
        return currentItems.map((item) =>
        item.id === product.id ? {
          ...item, quantity: item.quantity + 1 
        } : item
        );
      }
      return [...currentItems, {...product, quantity: 1}];
    });
  }

  /**
   * Entfernt ein Produkt volständig aus dem Warenkorb 
   */
  function removeItem(productId) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId))
  }

  /**
   * Erhöht die Menge eines bestimmten Produkts um eins.
   */
  function increaseQuantity(productId) {
    setItems((currentItems) => 
      currentItems.map((item) =>
        item.id === productId ? { 
          ... item, quantity: item.quantity + 1} : item
      )
    );
  }

  /**
   * Verringert die Menge eines bestimmten Produkts um eins.
   */
  function decreaseQuantity(productId) {
    setItems((currentItems) => 
      currentItems.map((item) =>
        item.id === productId ? { 
          ... item, quantity: item.quantity - 1} : item
      )
      .filter((item) => item.quantity > 0)
    );
  }

  /* Leert den gesamten Warenkorb */
  function clearCart() {
    setItems([]);
  }


  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = useMemo(
    () => ({
      items,
      totalQuantity,
      totalPrice,
      addItem,
      removeItem,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    }),
    [items, totalQuantity, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Stellt einen einfachen Zugriff auf den Warenkorb-Context bereit.
 */
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart muss innerhalb des CartProviders verwendet werden.");
  }
  return context;
}