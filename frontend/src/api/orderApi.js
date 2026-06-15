import { ApiError, BaseApi } from "./baseApi";

export class OrderApiError extends ApiError {
  constructor(message, status, payload) {
    super(message, status, payload);
    this.name = "OrderApiError";
  }
}

class OrderApi extends BaseApi {
  constructor() {
    super({
      defaultErrorMessage: "Bestellung fehlgeschlagen.",
      ErrorClass: OrderApiError,
    });
  }

  async createOrder(orderData, accessToken) {
    return this.request("/order/", {
      method: "POST",
      body: orderData,
      accessToken,
    });
  }

  async getMyOrders(accessToken) {
    return this.request("/order/me", {
      method: "GET",
      accessToken,
      errorMessage: "Bestellungen konnten nicht geladen werden.",
    });
  }
}


const orderApi = new OrderApi();

export { OrderApi };
export default orderApi;