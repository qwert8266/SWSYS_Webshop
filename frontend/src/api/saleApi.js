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

  async createSale({ discount, items, image = null}, accessToken) {
    const formData = new FormData();
    formData.append("data", JSON.stringify({
      discount: Number(discount),
      items: (items ?? []).map((item) => ({
        product_id: item.product_id ?? item.productId,
        volume: Number(item.volume),
        pack_size: Number(item.pack_size ?? item.packSize),
      })),
    }));
    if (image) formData.append("image", image);

    return this.request("/sales/", {
      method: "POST",
      body: formData,
      accessToken,
      errorMessage: "Angebot konnte nicht erstellt werden",
    });
  }

  async deleteSale(saleId, accessToken) {
    return this.request(`/sales/${saleId}`, {
      method: "DELETE",
      accessToken,
      errorMessage: "Angebot konnte nicht gelöscht werden",
    });
  }
}

const saleApi = new SaleApi();

export { SaleApi };
export default saleApi;
