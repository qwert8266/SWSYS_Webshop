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

  async updateOrder(orderData, accessToken) {
    console.log(orderData);
    console.log(orderData.orderId);
    return this.request(`/order/${orderData.orderId}`, {
      method: "PUT",
      body: orderData,accessToken,
      errorMessage: "Bestellung konnte nicht bearbeitet werden. Bitte versuche es erneut.",
    });
  }

  async getAllOrders(accessToken) {
    return this.request("/order/", {
      method: "GET",
      accessToken
    });
  }

}


const orderApi = new OrderApi();

export { OrderApi };
export default orderApi;