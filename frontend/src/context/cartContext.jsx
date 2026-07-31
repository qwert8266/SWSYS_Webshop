import { createContext, useContext, useEffect, useRef, useState } from "react";
import cartApi from "../api/cartApi";
import productApi from "../api/productApi";
import { useAuth } from "./authContext";
import { getCartItemPricing, normalizeProduct } from "../utils/productHelpers";

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
    console.warn("Loakler Warenkorb konnte nicht gelöscht werden", error);
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
 * Liefert die zu einer Warenkorbposition gehörende Variante
 */
function getCartVariant(item) {
  // neue Warenkorbpositionen besitzen `selectedVariant`
  if (item?.selectedVariant) {
    return item.selectedVariant;
  }

  const volume = Number(item?.volume ?? 0);
  const packSize = Number(item?.packSize ?? item?.k_size ?? 0);

  if (volume > 0 && packSize > 0) {
    return { volume, packSize };
  }

  return null;
}

/**
 * Erstellt die eindeutigkeit einer Warenkorbposition
 * Produkte mit Varianten können unter derselben Produkt-ID mehrfach im Warenkorb vorkommen
 */
function createCartKey(item, variant = getCartVariant(item)) {
  const productId = getCartProductId(item);

  if (!productId) {
    return null;
  }

  if (!variant) {
    // Für alte Produkte ohne Varianten
    return String(productId); 
  }

  return `${productId}-${Number(variant?.volume ?? 0)}-${Number(variant?.packSize ?? 0)}`;
}

/** 
 * Wandelt Produkt- und Warenkorbdaten in eine einheitliche Frontend-Struktur um
*/
function toClientCartItem(product, quantity, storedVariant = null) {
  if (!product) {
    return null;
  }
  
  const normalizedProduct = product?.id ? product : normalizeProduct(product);
  const productId = getCartProductId(normalizedProduct);
  const cartQuantity = getCartQuantity(quantity);

  if (!productId || cartQuantity <= 0) {
    return null
  }

  const images = Array.isArray(normalizedProduct.images)
    ? normalizedProduct.images.filter(Boolean) : normalizedProduct.image
      ? [normalizedProduct.image] : [];

  const selectedVariant = storedVariant ? normalizedProduct.variants?.find(
    (variant) =>
      variant.volume === Number(storedVariant.volume) && 
      variant.packSize === Number(storedVariant.packSize ?? storedVariant.pack_size)
  ) || storedVariant : normalizedProduct.selectedVariant || 
  normalizedProduct.variants?.[0] || null

  const preparedItem = {
    ...normalizedProduct,
    id: productId,
    product_id: productId,
    productId,
    images,
    image: normalizedProduct.image || images[0] || "no_picture.png",
    quantity: cartQuantity,
    selectedVariant,
    volume: Number(selectedVariant?.volume ?? 0),
    packSize: Number(selectedVariant?.packSize ?? selectedVariant?.pack_size ?? 0),
    depositPerPack: Number(selectedVariant?.depositPerPack ?? 0),
    price: selectedVariant?.price ?? normalizedProduct.price, // Der sichtbare Preis einer Warenkorbposition ist immer der Preis der ausgewählten Variante  
  };

  return {
    ...preparedItem,
    cartKey: createCartKey(preparedItem, selectedVariant),
  };
}

/**
 * Führt Backend- und Gäste-Warenkorb zusammen
 * Gleich Produkte werden nicht doppelt angezeigt, sondern über die Menge addiert
 * Varianten werden beim zusammenführen unterschieden
 */
function mergeCartItems(primaryItems, secondaryItems) { 
  const mergedItems = new Map();

  [...primaryItems, ...secondaryItems].forEach((item) => {
    const preparedItem = toClientCartItem(
      item,
      item?.quantity,
      getCartVariant(item)
    );

    if (!preparedItem.cartKey) {
      return;
    }
    
    const existingItem = mergedItems.get(preparedItem.cartKey);

    mergedItems.set(preparedItem.cartKey, {
      ...preparedItem,
      quantity: (existingItem?.quantity || 0) + preparedItem.quantity,
    });
  });

  return Array.from(mergedItems.values());
}

/**
 * Ergänzt die im Backend-Warenkorb gespeicherten Referenzen um vollständige Produktdaten
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
        return toClientCartItem(product, quantity, getCartVariant(item));
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
 * angemeldete Benutzer nutzen den Backend-Warenkorb
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

  /**
   * Lädt nach einer Anmeldung den Backend-Warenkorb
   * und übernimmt einmalig den zuvor lokal gespeicherten Gäste-Warenkorb
   */
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

        if (ignoreResult) {
          return;
        }

        const backendItems = await hydrateBackendCartItems(backendCartItems);
        const mergedItems = mergeCartItems(backendItems, guestItems);

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

  /** Speichert jede Warenkorbänderung entweder lokal oder im Backend */ 
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
  }, [items, isAuthLoading, accessToken, isBackendCartReady]);

  /** beendet einen noch laufenden Vorschau-Timer beim Entfernen des Providers */
  useEffect(() => {
    return () => {
      if (cartPreviewTimeoutRef.current) {
        clearTimeout(cartPreviewTimeoutRef.current);
      }
    };
  }, []);

  /** Öffnet die kleine Warenkorb-Vorschau in der Navbar */
  function showCartPreview() {
    if (cartPreviewTimeoutRef.current) {
      clearTimeout(cartPreviewTimeoutRef.current);
      cartPreviewTimeoutRef.current = null;
    }
    setIsCartPreviewOpen(true);
  }

  /** Schließt die Warenkorb-Vorschau */
  function hideCartPreview() {
    if (cartPreviewTimeoutRef.current) {
      clearTimeout(cartPreviewTimeoutRef.current);
    }
    cartPreviewTimeoutRef.current = setTimeout(() => {
      setIsCartPreviewOpen(false);
      cartPreviewTimeoutRef.current = null;
    }, 500);
  }

  /** Zeigt die Warenkorb-Vorschau kurz nach dem Hinzufügen eines Produktes */
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
   * Fügt eine bestimmte Produktvariante zum Warenkorb hinzu 
   * Die hinzugefügte Menge wird auf den aktuell bekannten Variantenbestand begrenzt 
   * */
  function addItem(product, quantity, availableStock, selectedVariant = null) {
    // genau die Produktvariante, die der Benutzer ausgewählt hat
    const variant =             
      selectedVariant || 
      product.selectedVariant || 
      product.variants?.[0] || 
      null;

    // die maximal verfügbare Anzahl dieser Variante
    const maxStock = Number.isFinite(availableStock)  
      ? availableStock
      : Number.isFinite(variant.stock ?? product.stock)
        ? variant?.stock ?? product.stock
        : Infinity;

    // bereinigt die Eingabe
    const requestedQuantity = getCartQuantity(quantity);

    // identifiziert die konkrete Variante eines Produkts
    const cartKey = createCartKey(product, variant);

    if (!cartKey || requestedQuantity <= 0) {
      return { added: 0, requested: requestedQuantity, capped: false };
    }


    const existingItem = items.find((item) => item.cartKey === cartKey);
    const quantityInCart = existingItem ? existingItem.quantity : 0;

    // die tatsächlich noch hinzufügbare Menge
      const addableQuantity = Math.max(
        0,
        Math.min(requestedQuantity, maxStock - quantityInCart)
      );

      if (addableQuantity <= 0) {
        return { added: 0, requested: requestedQuantity, capped: true};
      }

    setItems((currentItems) => {
      const currentItem = currentItems.find((item) => item.cartKey === cartKey);

      if (currentItem) {
        return currentItems.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + addableQuantity }
            : item
        );
      }

      return [...currentItems, 
        { 
          ...product, 
          cartKey,
          id: getCartProductId(product),
          product_id: getCartProductId(product),
          productId: getCartProductId(product),
          quantity: addableQuantity, 
          selectedVariant: variant,
          volume: Number(variant?.volume ?? 0),
          packSize: Number(variant?.packSize ?? variant?.pack_size ?? 0),
          depositPerPack: Number(variant?.depositPerPack ?? 0),
          price: variant?.price ?? product.price,
        },
      ];
    });

    if (addableQuantity > 0) {       
      openCartPreviewTemporarily();
    }

    return {
      added: addableQuantity,
      requested: requestedQuantity,
      capped: addableQuantity < requestedQuantity,
    };
  }
    

  /** Entfernt genau eine Warenkorbposition */
  function removeItem(cartKey) {
    setItems((currentItems) => 
      currentItems.filter((item) => item.cartKey !== cartKey)
    );
  }

  /** Erhöht die Menge einer Produktvariante um eins */
  function increaseQuantity(cartKey, availableStock) {
    const maxStock = Number.isFinite(availableStock) ? availableStock : Infinity;

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.cartKey === cartKey 
          ? { ...item, quantity: Math.min(item.quantity + 1, maxStock) }
          : item
      )
    );
  }

  /** Verringert die Menge einer Produktvariante */
  function decreaseQuantity(cartKey) {
    setItems((currentItems) => 
      currentItems.flatMap((item) => {
        if (item.cartKey !== cartKey) {
          return [item];
        }
        
        const nextQuantity = item.quantity - 1;

        return nextQuantity > 0 
          ? [{ ...item, quantity: nextQuantity }]
          : [];
      })
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalProductPrice = items.reduce(
    (sum, item) => sum + getCartItemPricing(item).productTotalPrice, 0);

  const totalDeposit = items.reduce((sum, item) => sum + getCartItemPricing(item).depositTotalPrice, 0);

  // Angebotspreise fließen in die Gesamtsumme ein
  const totalPrice = totalProductPrice + totalDeposit;

  {/*
  const value = useMemo(
    () => ({
      items,
      totalQuantity,
      totalProductPrice,
      totalDeposit,
      totalPrice,
      isCartLoading,
      cartError,
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
    [items, totalQuantity, totalProductPrice, totalDeposit, totalPrice, isCartPreviewOpen, isCartLoading]
  );
  */}

  const value = {
    items,
    totalQuantity,
    totalProductPrice,
    totalDeposit,
    totalPrice,
    isCartLoading,
    cartError,
    addItem,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    isCartPreviewOpen,
    showCartPreview,
    hideCartPreview,
    openCartPreviewTemporarily,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Zugriff auf den Warenkorb-Context innerhalb von Komponenten */
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart muss innerhalb des CartProviders verwendet werden.");
  }
  return context;
}
