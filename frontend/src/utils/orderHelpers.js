export function getPurchasedProductIds(orders = []) {
  const ids = new Set();

  for (const order of orders) {
    const items = Array.isArray(order?.items) ? order.items : [];

    for (const item of items) {
      const productId = item?.product_id || item?.productId;
      if (productId) {
        ids.add(String(productId));
      }
    }
  }

  return [...ids];
}
