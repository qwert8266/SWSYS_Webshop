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

  async register(userData) {
    return this.request("/user/register", {
      method: "POST",
      body: userData,
    });
  }


  async request(path, options = {}) {
    const { method = "GET", body, headers = {}} = options;

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

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