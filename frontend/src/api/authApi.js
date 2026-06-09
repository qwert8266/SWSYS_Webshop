const API_BASE_URL = "http://localhost:3001"; //ProcessingInstruction.env.REACT_BASE_URL || 

export class AuthApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.payload = payload;
  }
}

class AuthApi {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  // Sends the register form data to the backend endpoint
  async register(userData) {
    return this.request("/user/register", {
      method: "POST",
      body: userData,
    });
  }

  // sends email and password from the login form to the backend endpoint 
  async login(credentials) {
    return this.request("/user/login", {
      method: "POST",
      body: credentials,
    });
  }

  // Sends a logout request to the backend
  async logout(accessToken) {
    return this.request("/user/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } 

  // Loads the currently logged-in user by the stored access token
  async getCurrentUser(accessToken) {
    return this.request("(user/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }); 
  }


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

const authApi = new AuthApi();

export { AuthApi };
export default authApi;