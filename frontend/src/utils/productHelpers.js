
const FALLBACK_PRODUCT_IMAGE = "becks.png";

export function getProductImagePath(product) {
  const image = product?.image || FALLBACK_PRODUCT_IMAGE;

  if (String(image).startsWith("/")) {
    return image;
  }
  return `/img/product_images/${image}`;
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
  const image = product?.image;

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
