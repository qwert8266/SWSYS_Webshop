import { BaseApi } from "./baseApi";

class SaleApi extends BaseApi {
  constructor() {
    super({
      defaultErrorMessage: "Angebote konnten nicht geladen werden.",
    });
  }

  async getSales() {
    return this.request("/sales/");
  }
}

const saleApi = new SaleApi();

export { SaleApi };
export default saleApi;
