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

 /*
  async request(path, options = {}) {
    const { method = "GET", body, headers = {}} = options;

    let response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

    } catch (error) {
      throw new AuthApiError(
        "Backend nicht erreichbar.",
        0,
        { originalError: error.message }
      );
    }
    

    const payload = await this.parseJsonResponse(response);

    if (!response.ok) {
      throw new AuthApiError(
        this.getErrorMessage(payload),
        response.status,
        payload
      );
    }

    return payload;;
  }

  async parseJsonResponse(response) {
    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }


  getErrorMessage(payload) {
    return (
      payload?.error ||
      payload?.message ||
      "Registrierung fehlgeschlagen. Bitte prüfe deine Eingaben."
    );
  }
}
*/


const authApi = new AuthApi();

export { AuthApi };
export default authApi;