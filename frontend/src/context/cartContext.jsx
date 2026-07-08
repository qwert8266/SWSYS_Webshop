import { createContext, useContext, useEffect, useMemo, useState } from "react";


const CartContext = createContext(null);
const CART_STORAGE_KEY = "schmidt-shoping-cart";


/* Lädt einen ursprünglichen Warenkorb 
 * aus dem localStorage des Browsers. 
*/
function loadInitialCart() {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];

    /* Einträge aus altem Format ohne Varianten-Schlüssel verwerfen */
    return parsedCart.filter((item) => item?.cartKey);
  } catch (error) {
    console.warn("Warenkorb konnte nicht geladen werden", error);
    return [];
  }
}

/**
 * Eindeutiger Schlüssel eines Warenkorb-Eintrags.
 * Dasselbe Produkt kann in verschiedenen Varianten (Gebindegrößen)
 * als separate Einträge im Warenkorb liegen.
 */
function getCartKey(productId, variant) {
  if (!variant) {
    return String(productId);
  }
  return `${productId}__${variant.volume}__${variant.packSize}`;
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
   * Fügt eine Produktvariante dem Warenkorb hinzu.
   * Ist dieselbe Variante schon vorhanden, wird die Menge erhöht.
   */
  function addItem(product, quantity, variant) {
    const cartKey = getCartKey(product.id, variant);

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.cartKey === cartKey);
    
      /* Wenn die Variante bereits im Warenkorb ist */
      if (existingItem) {
        return currentItems.map((item) =>
        item.cartKey === cartKey ? {
          ...item, quantity: item.quantity + quantity
        } : item
        );
      }

      const cartItem = {
        cartKey,
        id: product.id,
        product_id: product.product_id || product.id,
        name: product.name,
        image: product.image,
        category: product.category,
        quantity,

        /* Daten der gewählten Variante */
        price: variant?.price ?? product.price,
        volume: variant?.volume ?? 0,
        packSize: variant?.packSize ?? 1,
        deposit: variant?.depositPerPack ?? 0,
        stock: variant?.stock ?? product.stock,
      };

      return [...currentItems, cartItem];
    });
  }

  /**
   * Entfernt eine Produktvariante volständig aus dem Warenkorb 
   */
  function removeItem(cartKey) {
    setItems((currentItems) => currentItems.filter((item) => item.cartKey !== cartKey))
  }

  /**
   * Erhöht die Menge einer bestimmten Produktvariante um eins.
   */
  function increaseQuantity(cartKey) {
    setItems((currentItems) => 
      currentItems.map((item) =>
        item.cartKey === cartKey ? { 
          ...item, quantity: item.quantity + 1} : item
      )
    );
  }

  /**
   * Verringert die Menge einer bestimmten Produktvariante um eins.
   */
  function decreaseQuantity(cartKey) {
    setItems((currentItems) => 
      currentItems.map((item) =>
        item.cartKey === cartKey ? { 
          ...item, quantity: item.quantity - 1} : item
      )
      .filter((item) => item.quantity > 0)
    );
  }

  /* Leert den gesamten Warenkorb */
  function clearCart() {
    setItems([]);
  }


  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  /* Warenwert ohne Pfand */
  const totalProductPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  /* Pfand über alle Gebinde */
  const totalDeposit = items.reduce(
    (sum, item) => sum + (item.deposit || 0) * item.quantity, 0
  );

  const totalPrice = totalProductPrice + totalDeposit;

  const value = useMemo(
    () => ({
      items,
      totalQuantity,
      totalProductPrice,
      totalDeposit,
      totalPrice,
      addItem,
      removeItem,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    }),
    [items, totalQuantity, totalProductPrice, totalDeposit, totalPrice]
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
