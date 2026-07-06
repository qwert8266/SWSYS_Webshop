
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