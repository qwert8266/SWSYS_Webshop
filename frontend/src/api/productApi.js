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
  async searchProducts(query) {
  const params = new URLSearchParams({ q: query });

  return this.request(`/products/search?${params.toString()}`);
  }
}

const productApi = new ProductApi();

export { ProductApi };
export default productApi;