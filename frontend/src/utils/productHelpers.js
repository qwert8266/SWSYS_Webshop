
const FALLBACK_PRODUCT_IMAGE = "no_picture.png";

export function getProductImagePath(product) {
  const image = product?.images?.[0] ?? FALLBACK_PRODUCT_IMAGE;

  return String(image).startsWith("/")
    ? image
    : `/img/product_images/${image}`;
}

/**
 * Wandelt eine Produktvariante aus dem Backend (Preise in Cent)
 * in das Frontend-Format mit Euro-Beträgen um.
 */
export function normalizeVariant(variant) {
  const volume = variant?.volume ?? 0;
  const packSize = variant?.pack_size ?? 1;
  const deposit = (variant?.deposit ?? 0) / 100;
  const crateDeposit = (variant?.crate_deposit ?? 0) / 100;

  return {
    /* Eindeutiger Schlüssel der Variante (Backend identifiziert über volume + pack_size) */
    key: `${volume}x${packSize}`,
    price: (variant?.price ?? 0) / 100,
    volume,
    packSize,
    deposit,
    crateDeposit,
    /* Pfand für das gesamte Gebinde: Flaschenpfand × Anzahl + Kistenpfand */
    depositPerPack: packSize * deposit + crateDeposit,
    stock: variant?.stock ?? 0,
  };
}

/** Formatiert ein Volumen in Millilitern als Liter-Angabe, z.B. 330 -> "0,33 l" */
export function formatVolume(volumeInMl) {
  return `${(volumeInMl / 1000).toLocaleString("de-DE", {
    maximumFractionDigits: 2,
  })} l`;
}

/** Bezeichnung eines Gebindes, z.B. "24 × 0,33 l" */
export function getVariantLabel(variant) {
  if (!variant) {
    return "";
  }
  return `${variant.packSize} × ${formatVolume(variant.volume)}`;
}

export function normalizeProduct(product) {
  const productId = product?.product_id;
  const name = product?.name || "Unbekanntes Produkt";
  const images = product?.images ?? (product?.image ? [product.image] : []);
  const image = images[0] ?? null;

  const variants = (product?.product_variants ?? []).map(normalizeVariant);

  /* Fallback für alte Produkte ohne Varianten mit Preis/Bestand auf Produktebene */
  const legacyPrice =
    typeof product?.price === "number" ? product.price / 100 : null;

  const minPrice =
    variants.length > 0
      ? Math.min(...variants.map((variant) => variant.price))
      : legacyPrice;

  const totalStock =
    variants.length > 0
      ? variants.reduce((sum, variant) => sum + variant.stock, 0)
      : product?.stock ?? null;

  return {
    ...product,
    id: productId,
    name,
    price: minPrice,
    image,
    images,
    category: product?.category,
    description: product?.description || "",
    stock: totalStock,
    rating: product?.raing ?? 0,
    variants,
    hasMultipleVariants: variants.length > 1,
  };
}

export function formatEuro(value) {
  return (Number(value || 0).toLocaleString("de-DE", {
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
  const currentPrice = Math.round(originalPrice * (100 - discountPercent)) / 100;

  return {
    isOnOffer: true,
    originalPrice,
    currentPrice,
    discountPercent,
  };
}

