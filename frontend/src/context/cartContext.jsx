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



export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitialCart);


  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Warenkorb konnte nicht gespeichert werden", error);
    }
  }, [items]);


  function addItem(product, quantity, availableStock) {
    const maxStock = Number.isFinite(availableStock)
      ? availableStock
      : product.stock ?? Infinity;

    const existingItem = items.find((item) => item.id === product.id);
    const quantityInCart = existingItem ? existingItem.quantity : 0;

    // Es darf nur so viel dazukommen, wie der Bestand abzüglich
    // der bereits im Warenkorb liegenden Menge hergibt
    const addableQuantity = Math.max(
      0,
      Math.min(quantity, maxStock - quantityInCart)
    );

    if (addableQuantity > 0) {
      setItems((currentItems) => {
        if (existingItem) {
          return currentItems.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + addableQuantity }
              : item
          );
        }
        return [...currentItems, { ...product, quantity: addableQuantity }];
      });
    }

    return {
      added: addableQuantity,
      requested: quantity,
      capped: addableQuantity < quantity,
    };
  }


  function removeItem(productId) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId))
  }


  function increaseQuantity(productId, availableStock) {
    const maxStock = Number.isFinite(availableStock) ? availableStock : Infinity;

    setItems((currentItems) => 
      currentItems.map((item) =>
        item.id === productId ? { 
          ...item, quantity: Math.min(item.quantity + 1, maxStock)} : item
      )
    );
  }


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


export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart muss innerhalb des CartProviders verwendet werden.");
  }
  return context;
}