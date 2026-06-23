import { ApiError, BaseApi } from "./baseApi";


export class AuthApiError extends ApiError {
  constructor(message, status, payload) {
    super(message, status, payload);
    this.name = "AuthApiError";
  }
}

class AuthApi extends BaseApi {
  constructor() {
    super({
      defaultErrorMessage: "Authentifizierung fehlgeschlagen. Bitte prüfe deine Eingaben.",
      ErrorClass: AuthApiError,
    });
  }

  // Sends the register form data to the backend endpoint
  async register(userData) {
    return this.request("/user/register", {
      method: "POST",
      body: userData,
      errorMessage: "Registrierung fehlgeschlagen. Bitte prüfe deine Eingaben.",
    });
  }

  // sends email and password from the login form to the backend endpoint 
  async login(credentials) {
    return this.request("/user/login", {
      method: "POST",
      body: credentials,
      errorMessage: "Anmeldung fehlgeschlagen. Bitte prüfe deine Eingaben.",
    });
  }

  async requestPasswordReset(email) {
    return this.request("/user/password-reset/request", {
      method: "POST",
      body: { email },
      errorMessage: "Passwort-Reset konnte nicht angefordert werden.",
    });
  }

  async confirmPasswordReset({token, password }) {
    return this.request("/user/password-reset/confirm", {
      method: "POST",
      body: { token, password },
      errorMessage: "Passwort konnte nicht zurückgesetzt werden.",
    });
  }

  async changePassword(accessToken, passwordData) {
    return this.request("/user/me/password", {
      method: "PATCH",
      body: passwordData,
      accessToken,
      errorMessage: "Passwort konnte nicht geändert werden.",
    });
  }

  // Sends a logout request to the backend
  async logout(accessToken) {
    return this.request("/user/logout", {
      method: "POST",
      accessToken,
      errorMessage: "Abmeldung fehlgeschlagen.",
    });
  } 

  // Loads the currently logged-in user by the stored access token
  async getCurrentUser(accessToken) {
    return this.request("/user/me", {
      method: "GET",
      accessToken,
      errorMessage: "Benutzerdaten konnten nich geladen werden.",
    }); 
  }
}

 

const authApi = new AuthApi();

export { AuthApi };
export default authApi;