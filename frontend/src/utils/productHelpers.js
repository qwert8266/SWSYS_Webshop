
const FALLBACK_PRODUCT_IMAGE = "no_picture.png";

export function getProductImagePath(product) {
  const image = product?.images?.[0] ?? FALLBACK_PRODUCT_IMAGE;

  return String(image).startsWith("/")
    ? image
    : `/img/product_images/${image}`;
}

export function normalizeProduct(product) {
  const productId = product?.product_id;
  const name = product?.name || "Unbekanntes Produkt";
  const price = product?.price;
  const image = product?.image;

  return {
    ...product,
    id: productId,
    name,
    price: price / 100,
    image,
    category: product?.category,
    description: product?.description || "",
    stock: product?.stock ?? null,
    rating: product?.raing ?? 0,
  };
}

export function formatEuro(valueInCents) {
  return (Number(valueInCents || 0).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  }));
}

/**
 * Ein Produkt gilt als "im Angebot", wenn das Backend einen
 * positiven Rabatt (in Prozent) am Produkt hinterlegt hat.
 */
export function isOnOffer(product) {
  const discount = Number(product?.discount);
  return Number.isFinite(discount) && discount > 0;
}

/**
 * Liefert alle Preisinformationen zu einem Produkt:
 * - originalPrice: regulärer Preis (in Euro)
 * - currentPrice: tatsächlich zu zahlender Preis (bei Angebot reduziert)
 * - discountPercent: Rabatt in Prozent (0, wenn kein Angebot)
 */
export function getOfferPricing(product) {
  const originalPrice = Number(product?.price) || 0;

  if (!isOnOffer(product)) {
    return {
      isOnOffer: false,
      originalPrice,
      currentPrice: originalPrice,
      discountPercent: 0,
    };
  }

  const discountPercent = Math.min(100, Math.round(Number(product.discount)));
  // Auf ganze Cents runden, damit Warenkorb-Summen konsistent bleiben
  const currentPrice = Math.round(originalPrice * (100 - discountPercent)) / 100;

  return {
    isOnOffer: true,
    originalPrice,
    currentPrice,
    discountPercent,
  };
}