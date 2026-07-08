import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getOfferPricing } from "../utils/productHelpers";


const CartContext = createContext(null);
const CART_STORAGE_KEY = "schmidt-shoping-cart";



function loadInitialCart() {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];

    return parsedCart.filter((item) => item?.cartKey);
  } catch (error) {
    console.warn("Warenkorb konnte nicht geladen werden", error);
    return [];
  }
}

function getCartKey(productId, variant) {
  if (!variant) {
    return String(productId);
  }
  return `${productId}__${variant.volume}__${variant.packSize}`;
}


export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitialCart);
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
  const cartPreviewTimeoutRef = useRef(null);


  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Warenkorb konnte nicht gespeichert werden", error);
    }
  }, [items]);

  useEffect(() => {
    return () => {
      if (cartPreviewTimeoutRef.current) {
        clearTimeout(cartPreviewTimeoutRef.current);
      }
    };
  }, []);

  function showCartPreview() {
    if (cartPreviewTimeoutRef.current) {
      clearTimeout(cartPreviewTimeoutRef.current);
      cartPreviewTimeoutRef.current = null;
    }
    setIsCartPreviewOpen(true);
  }

  function hideCartPreview() {
    if (cartPreviewTimeoutRef.current) {
      clearTimeout(cartPreviewTimeoutRef.current);
    }
    cartPreviewTimeoutRef.current = setTimeout(() => {
      setIsCartPreviewOpen(false);
      cartPreviewTimeoutRef.current = null;
    }, 500);
  }

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

  function addItem(product, quantity, variant, availableStock) {
    const cartKey = getCartKey(product.id, variant);
    const variantStock = variant?.stock ?? product.stock;
    const maxStock = Number.isFinite(availableStock)
      ? availableStock
      : (Number.isFinite(variantStock) ? variantStock : Infinity);

    const existingItem = items.find((item) => item.cartKey === cartKey);
    const quantityInCart = existingItem ? existingItem.quantity : 0;

    const addableQuantity = Math.max(
      0,
      Math.min(quantity, maxStock - quantityInCart)
    );

    if (addableQuantity > 0) {
      setItems((currentItems) => {
        const currentExisting = currentItems.find((item) => item.cartKey === cartKey);

        if (currentExisting) {
          return currentItems.map((item) =>
            item.cartKey === cartKey
              ? { ...item, quantity: item.quantity + addableQuantity }
              : item
          );
        }

        const cartItem = {
          cartKey,
          id: product.id,
          product_id: product.product_id || product.id,
          name: product.name,
          image: product.image ?? product.images?.[0],
          category: product.category,
          discount: product.discount,
          quantity: addableQuantity,
          price: variant?.price ?? product.price,
          volume: variant?.volume ?? 0,
          packSize: variant?.packSize ?? 1,
          deposit: variant?.depositPerPack ?? 0,
          stock: variantStock,
        };

        return [...currentItems, cartItem];
      });

      openCartPreviewTemporarily();
    }

    return {
      added: addableQuantity,
      requested: quantity,
      capped: addableQuantity < quantity,
    };
  }

  function removeItem(cartKey) {
    setItems((currentItems) => currentItems.filter((item) => item.cartKey !== cartKey));
  }

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

  function decreaseQuantity(cartKey) {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalProductPrice = items.reduce(
    (sum, item) => sum + getOfferPricing(item).currentPrice * item.quantity,
    0
  );

  const totalDeposit = items.reduce(
    (sum, item) => sum + (item.deposit || 0) * item.quantity,
    0
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
      isCartPreviewOpen,
      showCartPreview,
      hideCartPreview,
      openCartPreviewTemporarily,
    }),
    [items, totalQuantity, totalProductPrice, totalDeposit, totalPrice, isCartPreviewOpen]
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
