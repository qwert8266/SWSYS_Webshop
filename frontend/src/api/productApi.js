import { BaseApi } from "./baseApi";



class ProductApi extends BaseApi {
  constructor() {
    super({
      defaultErrorMessage: "Produkte konnten nicht geladen werden.",
    });
  }

  async getProducts() {
    return this.request("/products/");
  }

  async getProductsByCategory(category) {
    return this.request(`/products/category/${encodeURIComponent(category)}`);
  }

  async getProductById(productId) {
    return this.request(`/products/${encodeURIComponent(productId)}`);
  }

  async createProduct(productData) {
    return this.request("/products/product_management", {
      method: "POST",
      body: productData,
      errorMessage: "Produkt konnte nicht hinzugefügt werden. Bitte überprüfe deine Eingaben.",
    });
  }

  async updateProduct(productData) {
    return this.request(`/products/${productData.id}`, {
      method: "PUT",
      body: productData,
      errorMessage: "Produkt konnte nicht bearbeitet werden. Bitte versuche es erneut.",
    });
  }

  async deleteProduct(uuid) {
    return this.request(`/products/${uuid}`, {
      method: "DELETE",
      body: uuid,
      errorMessage: "Produkt konnte nicht gelöscht werden.",
    });
  }
}

const productApi = new ProductApi();

export { ProductApi };
export default productApi;