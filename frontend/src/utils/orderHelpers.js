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

export function totalItems(orderItems){
  let itemCount = 0;
  for (let i = 0; i < orderItems.length; i++){
    itemCount += orderItems[i].quantity;
  }
  return((itemCount.toString()) + "x")
}

export function formatEuro(valueInCents) {
  return (Number(valueInCents || 0) /100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}
