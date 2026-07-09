import { BaseApi } from "./baseApi";

class ListApi extends BaseApi {
  constructor() {
    super({
      defaultErrorMessage: "Listen konnten nicht geladen werden.",
    });
  }

  async getLists(accessToken) {
    return this.request("/user/me/lists", {
      method: "GET",
      accessToken,
    });
  }

  async getFavorites(accessToken) {
    return this.request("/user/me/favorites", {
      method: "GET",
      accessToken,
    });
  }

  async getWishlist(accessToken) {
    return this.request("/user/me/wishlist", {
      method: "GET",
      accessToken,
    });
  }

  async toggleFavorite(productId, accessToken) {
    return this.request(`/user/me/favorites/${encodeURIComponent(productId)}`, {
      method: "POST",
      accessToken,
    });
  }

  async toggleWishlist(productId, accessToken) {
    return this.request(`/user/me/wishlist/${encodeURIComponent(productId)}`, {
      method: "POST",
      accessToken,
    });
  }
}

const listApi = new ListApi();

export default listApi;
