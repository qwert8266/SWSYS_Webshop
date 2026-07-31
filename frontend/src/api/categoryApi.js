import { BaseApi } from "./baseApi";

class CategoryApi extends BaseApi {
  constructor() {
    super({
      defaultErrorMessage: "Kategorien konnten nicht geladen werden.",
    });
  }

  async getCategories() {
    return this.request("/category/");
  }

  async createCategory(categoryData, accessToken) {
    return this.request("/category/", {
      method: "POST",
      body: categoryData,
      accessToken,
      errorMessage: "Kategorie konnte nicht hinzugefügt werden.",
    });
  }
  
  async updateCategory(slug, categoryData, accessToken) {
    return this.request(`/category/${encodeURIComponent(slug)}`, {
      method: "PUT",
      body: categoryData,
      accessToken,
      errorMessage: "Kategorie konnte nicht bearbeitet werden",
    });
  }

  async deleteCategory(slug, accessToken) {
    return this.request(`/category/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      accessToken,
      errorMessage: "Kategorie konnte nicht gelöscht werden.",
    });
  }
}

const categoryApi = new CategoryApi();

export { CategoryApi };
export default categoryApi;