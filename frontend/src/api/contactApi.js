import { BaseApi } from "./baseApi";

class ContactApi extends BaseApi {
  constructor() {
    super({ defaultErrorMessage: "Kontaktanfrage konnte nicht abgesendet werden." });
  }

  submitContactRequest(contactRequest, accessToken) {
    return this.request("/contact", {
      method: "POST",
      body: contactRequest,
      accessToken,
      errorMessage: "Kontaktanfrage konnte nicht abgesendet werden.",
    });
  }
}

export const contactApi = new ContactApi();