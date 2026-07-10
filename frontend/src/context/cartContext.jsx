import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import cartApi from "../api/cartApi";
import productApi from "../api/productApi";
import { useAuth } from "./authContext";
import { getOfferPricing } from "../utils/productHelpers";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "schmidt-shopping-cart";


/* Lädt einen Warenkorb für nicht angemeldete Benutzer aus dem Browser 
 * Defekte oder unerwartete localStorage-Daten werden als leerer Warenkorb behandelt
*/
function loadGuestCart() {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];

    return Array.isArray(parsedCart) ? parsedCart.filter(Boolean) : [];
  } catch (error) {
    console.warn("Warenkorb konnte nicht geladen werden", error);
    return [];
  }
}

/**
 * Speichert den Warenkorb nur für Gäste lokal im Browser
 */
function saveGuestCart(items) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Warenkorb konnte nicht gespeichert werden", error);
  }
}

/**
 * Entfernt den lokalen Gäste-Warenkorb nach erfolgreicher backen-Synchronisierung
 */
function clearGuestCart(items) {
  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.warm("Loakler Warenkorb konnte nicht gelöscht werden", error);
  }
}

/**
 * Ermittelt die Produkt-ID unabhängig davon, ob sie aus Backend oder Frontend stammt
 */
function getCartProductId(item) {
  return item?.product_id || item?.productId || item?.productID;
}

/**
 * Wandelt Meinge in positive ganze Zahl um
 */
function getCartQuantity(quantity) {
  const parsedQuantity = Number(quantity);
  return Number.isFinite(parsedQuantity) && parsedQuantity > 0
    ? Math.floor(parsedQuantity) : 0;
}

/** 
 * Erstellt ein vollständig nutzbares Frontend-Warenkorb 
*/
function toClientCartItem(product, quantity) {
  const normalizedProduct = product?.id ? product : normalizedProduct(product);
  const productId = getCartProductId(normalizedProduct);
  const cartQuantity = getCartQuantity(quantity);

  if (!product || cartQuantity <= 0) {
    return null
  }

  const images = Array.isArray(normalizedProduct.images)
    ? normalizedProduct.images.filter(Boolean) : normalizedProduct.image
      ? [normalizedProduct.image] : [];

  return {
    ...normalizedProduct,
    id: productId,
    product_id: productId,
    productId,
    images,
    image: normalizedProduct.image || images[0] || "no_picture.png",
    quantity: cartQuantity,
  };
}

/**
 * Führt Backend- und Gäste-Warenkorb zusammen
 * Gleich Produkte werden nicht doppelt angezeigt, sondern über die Menge addiert
 */
function mergeCartItems(primaryItems, secondaryItems) {
  const mergedItems = new Map();

  [...primaryItems, ...secondaryItems].forEach((item) => {
    const productId = getCartProductId(item);
    const quantity = getCartQuantity(item?.quantity);

    if (!productId || quantity <= 0) {
      return;
    }

    const preparedItem = toClientCartItem(item, quantity);
    if (!preparedItem) {
      return;
    }
    
    const existingItem = mergedItems.get(productId);
    mergedItems.set(productId, {
      ...preparedItem,
      quantity: (existingItem?.quantity || 0) + quantity,
    });
  });

  return Array.from(mergedItems.values());
}

/**
 * Läft Produktdetails zu den im Backend gespeicherten Warenkorboptionen
 * Nicht mehr vorhandene Produkte werden übersprungen, damit der Warenkorb weiterhin nutzbar bleibt
 */
async function hydrateBackendCartItems(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return [];
  }

  const hydratedItems = await Promise.all(
    cartItems.map(async (item) => {
      const productId = getCartProductId(item);
      const quantity = getCartQuantity(item?.quantity);

      if (!productId || quantity <= 0) {
        return null;
      }

      try {
        const product = await productApi.getProductById(productId);
        return toClientCartItem(product, quantity);
      } catch (error) {
        console.warn(`Product ${productId} aus dem Warnekorb konnte nicht geladen werden.`, error);
        return null;
      }
    })
  );

  return hydratedItems.filter(Boolean);
}


/**
 * Stellt den Warenkorb global bereit
 * Gäste nutzen localStorage
 * angemeldete Benutzer nutzen den backendgespeicherten Warenkorb
 */
export function CartProvider({ children }) {
  const { accessToken, isAuthLoading } = useAuth();

  const [items, setItems] = useState(loadGuestCart);
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [isBackendCartReady, setIsBackendCartReady] = useState(false);
  
  const cartPreviewTimeoutRef = useRef(null);
  const lastSavedCartRef = useRef("");

  // Nach dem Login wird der backend-Warenkorb geladen
  // Falls vorher ein Gäste-Warenkorb existiert, wird der einmalig übernommen
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    let ignoreResult = false;

    async function loadBackendCart() {
      if (!accessToken) {
        setIsBackendCartReady(false);
        setCartError("");
        setItems(loadGuestCart());
        return;
      }

      setIsCartLoading(true);
      setCartError("");
      setIsBackendCartReady(false);

      const guestItems = loadGuestCart();

      try {
        let backendCartItems = [];

        try {
          const backendCart = await cartApi.getMyCart(accessToken);
          backendCartItems = Array.isArray(backendCart?.items) ? backendCart.items : [];
        } catch (error) {
          if (error.status !== 404) {
            throw error;
          }
        }

        const backendItems = await hydrateBackendCartItems(backendCartItems);
        const mergedItems = mergeCartItems(backendItems, guestItems);

        if (ignoreResult) {
          return;
        }

        setItems(mergedItems);
        setIsBackendCartReady(true);
        clearGuestCart();
        lastSavedCartRef.current = JSON.stringify(mergedItems);

        // Zusammengeführte Warenkörbe werden direkt gespeichert, damit Backend und UI übereinstimmen
        await cartApi.updateCart(mergedItems, accessToken);
      } catch (error) {
        if (!ignoreResult) {
          console.warn("Warenkorb konnte nicht aus dem Backend geladen werden", error);
          setCartError(error.message || "Warenkorb konnte nicht geladen werden.");
          setIsBackendCartReady(true);
        }
      } finally {
        if (!ignoreResult) {
          setIsCartLoading(false);
        }
      }
    }

    loadBackendCart();

    return () => {
      ignoreResult = true;
    };
  }, [accessToken, isAuthLoading]);

  // Gäste speichern weiter im localStorage
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!accessToken) {
      if (isBackendCartReady) {
        return;
      }
      saveGuestCart(items);
      return;
    }

    if (!isBackendCartReady) {
      return;
    }

    const serializedCart = JSON.stringify(items);
    if (serializedCart === lastSavedCartRef.current) {
      return;
    }

    lastSavedCartRef.current = serializedCart;

    async function saveBackendCart() {
      try {
        if (items.length === 0) {
          await cartApi.clearCart(accessToken);
        } else {
          await cartApi.updateCart(items, accessToken);
        }
        setCartError("");
      } catch (error) {
        console.warn("Warenkorb konnte nicht im Backend gespeichert werden", error);
        setCartError(error.message || "Warenkorb konnte nicht gespeichert werden");
      }
    }

    saveBackendCart();
  }, [items]);

  useEffect(() => {
    return () => {
      if (cartPreviewTimeoutRef.current) {
        clearTimeout(cartPreviewTimeoutRef.current);
      }
    };
  }, [accessToken, isAuthLoading, isBackendCartReady, items]);

  useEffect(() => {
    return () => {
      if (cartPreviewTimeoutRef.current) {
        clearTimeout(cartPreviewTimeoutRef.current);
      }
    };
  }, []);

  /** 
   * Öffnet die kleine Warenkorb-Vorschau in der Navbar 
   */
  function showCartPreview() {
    if (cartPreviewTimeoutRef.current) {
      clearTimeout(cartPreviewTimeoutRef.current);
      cartPreviewTimeoutRef.current = null;
    }
    setIsCartPreviewOpen(true);
  }

  /**
   * Schließt die Warenkorb-Vorschau
   */
  function hideCartPreview() {
    if (cartPreviewTimeoutRef.current) {
      clearTimeout(cartPreviewTimeoutRef.current);
    }
    cartPreviewTimeoutRef.current = setTimeout(() => {
      setIsCartPreviewOpen(false);
      cartPreviewTimeoutRef.current = null;
    }, 500);
  }

  /**
   * Zeigt die Warenkorb-Vorschau kurz nach dem Hinzufügen eines Produktes
   */
  function openCartPreviewTemporarily() {
    if (cartPreviewTimeoutRef.current) {
      clearTimeout(cartPreviewTimeoutRef.current);
    }
    setIsCartPreviewOpen(true);
    cartPreviewTimeoutRef.current = setTimeout(() => {
      setIsCartPreviewOpen(false);
      cartPreviewTimeoutRef.current = null;
    }, 3000);
  }
    
  /**
   * Fügt ein Produkt hinzu und begrenzt die Menge auf den aktuell bekannten Bestand 
   */
  function addItem(product, quantity, availableStock) {
    const maxStock = Number.isFinite(availableStock)
      ? availableStock
      : product.stock ?? Infinity;

    const existingItem = items.find((item) => item.id === product.id);
    const quantityInCart = existingItem ? existingItem.quantity : 0;

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

      openCartPreviewTemporarily();
    }

    return {
      added: addableQuantity,
      requested: quantity,
      capped: addableQuantity < quantity,
    };
  }
    

  /**
   * Entfernt ein Produkt vollständig aus dem Warenkorb
   */
  function removeItem(productId) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId))
  }

  /**
   * Erhöht die Menge eines Produkt
   */
  function increaseQuantity(productId, availableStock) {
    const maxStock = Number.isFinite(availableStock) ? availableStock : Infinity;

    setItems((currentItems) => 
      currentItems.map((item) =>
        item.id === productId ? { 
          ...item, quantity: Math.min(item.quantity + 1, maxStock)} : item
      )
    );
  }

  /**
   * Verringert die Menge eines Produktes
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
  // Angebotspreise fließen in die Gesamtsumme ein,
  // damit Warenkorb und Checkout den reduzierten Preis verwenden
  const totalPrice = items.reduce(
    (sum, item) => sum + getOfferPricing(item).currentPrice * item.quantity,
    0
  );

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
      isCartPreviewOpen,
      showCartPreview,
      hideCartPreview,
      openCartPreviewTemporarily,
    }),
    [items, totalQuantity, totalPrice, isCartPreviewOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Zugriff auf den Warenkorb-Context innerhalb von Komponenten
 */
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart muss innerhalb des CartProviders verwendet werden.");
  }
  return context;
}