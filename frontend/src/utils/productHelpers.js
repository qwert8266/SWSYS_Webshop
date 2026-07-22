
const FALLBACK_PRODUCT_IMAGE = "no_picture.png";


export function productHasCategory(product, categorySlugOrName) {
  const categories = Array.isArray(product?.categories) ? product.categories : [];

  return categories.some((category) => {
    return (
      category.slug === categorySlugOrName || category.name === categorySlugOrName
    );
  }); 
}

export function getProductImagePath(product) {
  const image = product?.images?.[0] ?? FALLBACK_PRODUCT_IMAGE;

  return String(image).startsWith("/")
    ? image
    : `/img/product_images/${image}`;
}

/** Convertes a stored category banner path into its public frontend URL */
export function getCategoryBannerPath(category) {
  const banner = category?.banner;

  if(!banner) {
    return "/img/product_images/no_picture.png";
  }

  const normalizedBanner = String(banner).replace(/\\/g, "/");
  return normalizedBanner.startsWith("/")
    ? normalizedBanner
    : `/img/product_images/${normalizedBanner}`;

}

/** Banner-Pfad eines Sales (Datei liegt unter /images/sale/ im Shared Volume). */
export function getSaleBannerPath(sale) {
  const banner = sale?.banner;

  if (!banner) {
    return null;
  }

  const normalizedBanner = String(banner).replace(/\\/g, "/");
  return `/img/product_images/sale/${normalizedBanner}`;
}

/**
 * Wandelt eine Produktvariante aus dem Backend (Preise in Cent)
 * in das Frontend-Format mit Euro-Beträgen um.
 */
export function normalizeVariant(variant) {
  const volume = Number(variant?.volume ?? 0);
  const packSize = Number(variant?.pack_size ?? variant?.packSize ?? 0);
  
  // Bereits normalisierte Frontend-Varianten enthalten Euro-Werte
  // Rohe Backend-Varianten enthalten Cent-Werte
  const isFrontendVariant = variant?.packSize !== undefined;
  const deposit = isFrontendVariant 
    ? Number(variant?.deposit ?? 0) 
    : Number(variant?.deposit ?? 0) / 100;
  const crateDeposit = isFrontendVariant
    ? Number(variant?.crateDeposit ?? variant?.crate_deposit ?? 0) 
    : Number(variant?.crateDeposit ?? variant?.crate_deposit ?? 0) / 100;
  const price = isFrontendVariant
    ? Number(variant?.price ?? 0)
    : Number(variant?.price ?? 0) / 100;

  const discount = Number(variant?.discount ?? 0);

  return {
    key: variant?.key || `${volume}x${packSize}`,
    price,
    volume,
    packSize,
    deposit,
    crateDeposit,
    depositPerPack: packSize * deposit + crateDeposit,
    stock: variant?.stock ?? 0,
    label: variant?.variant_label || null,
    discount: Number.isFinite(discount) ? discount : 0,
  };
}

/** Formatiert ein Volumen in Millilitern als Liter-Angabe, z.B. 330 -> "0,33 l" */
export function formatVolume(volumeInMl) {
  return `${(volumeInMl / 1000).toLocaleString("de-DE", {
    maximumFractionDigits: 2,
  })} l`;
}

/** Bezeichnung eines Gebindes – bevorzugt variant_label vom Backend */
export function getVariantLabel(variant) {
  if (!variant) {
    return "";
  }
  if (variant.label || variant.variant_label) {
    return variant.label || variant.variant_label;
  }
  const packSize = variant.packSize ?? variant.pack_size ?? 0;
  const volume = variant.volume ?? 0;
  return `${packSize} × ${formatVolume(volume)}`;
}

/** Varianten-Label aus Stock-API-Eintrag */
export function getStockVariantLabel(stockInfo) {
  if (stockInfo?.variant_label) {
    return stockInfo.variant_label;
  }

  const packSize = Number(stockInfo?.pack_size ?? stockInfo?.packSize ?? 0);
  const volume = Number(stockInfo?.volume ?? 0);

  if (packSize === 0 && volume === 0) {
    return null;
  }

  return getVariantLabel({ packSize, volume });
}

export function normalizeProduct(product) {
  const productId = product?.product_id ?? product?.productId;
  const name = product?.name || "Unbekanntes Produkt";
  
  const images = Array.isArray(product?.images)
    ? product.images.filter(Boolean)
    : product?.image
      ? [product.image]
      : [];

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
    id: product?.product_id || productId,
    name,
    price: minPrice,
    images,
    categories: Array.isArray(product?.categories) ? product.categories : [],
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
 * Liefert die für die Preisanzeige relevante Variante.
 * Bei einer Warenkorbposition ist das die ausgewählte Variante.
 * In einer Produktliste wird die günstigste rabattierte Variante verwendet 
 */
export function getOfferVariant(product) {
  if (!product) { return null; }

  if (product.selectedVariant) {
    return product.selectedVariant;
  }

  if (product.packSize != null || product.pack_size != null) {
    return product;
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const discountedVariants = variants.filter((variant) => 
    Number(variant?.discount) > 0
  );

  if (discountedVariants.length === 0) {
    return null;
  }

  return discountedVariants.reduce((best, variant) => {
    const bestPrice = Number(best.price) * (100 - Number(best.discount)) / 100;
    const variantPrice = Number(variant.price) * (100 - Number(variant.discount)) / 100;
    return variant.price < bestPrice ? variant : best;
  })

}

/**
 * Ein Produkt gilt als "im Angebot", wenn das Backend einen
 * positiven Rabatt (in Prozent) am Produkt hinterlegt hat.
 */
export function isOnOffer(product) {
  return Boolean(getOfferVariant(product));

}

/**
 * Liefert die Preisinformationen einer Variante.
 * Der Rabatt gilt ausschließlich für diese Varainte.
 * - originalPrice: regulärer Preis (in Euro)
 * - currentPrice: tatsächlich zu zahlender Preis (bei Angebot reduziert)
 * - discountPercent: Rabatt in Prozent (0, wenn kein Angebot)
 */
export function getOfferPricing(product) {
  const offerVariant = getOfferVariant(product);
  const fallbackVariant = product?.selectedVariant ||
    (product?.packSize != null || 
      product?.pack_size != null ? product : null);
  const priceSource = offerVariant || fallbackVariant;
  const originalPrice = Number(priceSource?.price ?? product?.price) || 0;
  const discountPercent = Math.min(100, Math.max(0, Math.round(Number(offerVariant?.discount ?? 0))));
  const currentPrice = discountPercent > 0 
    ? Math.round(originalPrice * (100 - discountPercent)) / 100 
    : originalPrice;

  return {
    isOnOffer: discountPercent > 0,
    originalPrice,
    currentPrice,
    discountPercent,
    variant: priceSource,
  };
}

/** Liefert den Pfandbetrag einer Warenkorbposition */
export function getItemDeposit(item) {
  return Number(
    item?.selectedVariant?.depositPerPack ??
      item.depositPerPack ??
      0
  );
}

/**
 * Berechnet die Preisbestandteile einer Warenkorbposition 
 */
export function getCartItemPricing(item) {
  const quantity = Math.max(0, Number(item?.quantity || 0));
  const productUnitPrice = getOfferPricing(item).currentPrice;
  const depositUnitPrice = getItemDeposit(item);

  return {
    quantity,
    productUnitPrice,
    depositUnitPrice,
    productTotalPrice: productUnitPrice * quantity,
    depositTotalPrice: depositUnitPrice * quantity,
    totalPrice: (productUnitPrice + depositUnitPrice) * quantity,
  };
}

