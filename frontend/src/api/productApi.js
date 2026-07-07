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

  // Loads only the stock info of a single product (much smaller than the full product)
  async getProductStock(productId) {
    return this.request(`/products/${encodeURIComponent(productId)}/stock`, {
      errorMessage: "Bestand konnte nicht geladen werden.",
    });
  }

  // Loads the stock info of all products, including the central thresholds
  async getAllStock() {
    return this.request("/products/stock", {
      errorMessage: "Bestände konnten nicht geladen werden.",
    });
  }

  // Employee-only: loads all products at or below the low-stock threshold
  async getLowStockProducts(accessToken) {
    return this.request("/products/stock/low", {
      accessToken,
      errorMessage: "Produkte mit niedrigem Bestand konnten nicht geladen werden.",
    });
  }
}

const productApi = new ProductApi();

export { ProductApi };
export default productApi;