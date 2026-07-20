import { ApiError, BaseApi } from "./baseApi";

export class CartApiError extends ApiError {
  constructor(message, status, payload) {
    super(message, status, payload);
    this.name = "CartApiError";
  }
}

class CartApi extends BaseApi {
  constructor() {
    super({
      defaultErrorMessage: "Warenkorb konnte nicht verarbeitet werden",
      ErrorClass: CartApiError,
    });
  }

  async getMyCart(accessToken) {
    return this.request("/cart/me", {
      method: "GET",
      accessToken,
      errorMessage: "Warenkorb konnte nicht geladen werden",
    });
  }

  async updateCart(items, accessToken) {
    return this.request("/cart/", {
      method: "PUT",
      accessToken,
      body: {
        items: items.map((item) => ({
          product_id: item.product_id || item.productID || item.productId,
          quantity: Number(item.quantity),
          volume: Number(item.selectedVariant?.volume ?? item.volume ?? 0),
          pack_size: Number(
            item.selectedVariant?.packSize ?? 
            item.selectedVariant?.pack_size ??
            item.packSize ??
            item.pack_size ??
            0
          ),
        })),
      },
      errorMessage: "Warenkorb konnte nicht gespeichert werden",
    }); 
  }

  async clearCart(accessToken) {
    return this.request("/cart/", {
      method: "DELETE",
      accessToken,
      errorMessage: "Warenkorb konnte nicht geleert werden",
    });
  }
}

const cartApi = new CartApi();

export { CartApi };
export default cartApi;