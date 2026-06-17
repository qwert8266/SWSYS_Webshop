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
      errorMessage: "Produkt konnte nicht hinzugefügt werden. Bitte überprüfe deine Eingaben",
    });
  }
}

const productApi = new ProductApi();

export { ProductApi };
export default productApi;