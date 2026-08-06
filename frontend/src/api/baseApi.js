const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

export const ACCESS_TOKEN_KEY = "Schmidt-Soehne_AT";
export const REFRESH_TOKEN_KEY = "Schmidt-Soehne_RT";
export const AUTH_TOKENS_UPDATED_EVENT = "auth:tokens-updated";
export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";
 
let refreshRequest = null;

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export class BaseApi {
  constructor({
    baseUrl = API_BASE_URL,
    defaultErrorMessage = "Anfrage fehlgeschlagen.",
    ErrorClass = ApiError,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.defaultErrorMessage = defaultErrorMessage;
    this.ErrorClass = ErrorClass;
  }
  
  // request sends an API request and renews an expired access token
  async request(path, options = {}) {
    const response = await this.sendRequest(path, options);

    if (response.ok) {
      return this.parseJsonResponse(response);
    }

    const shouldRefresh = response.status === 401
      && Boolean(options.accessToken)
      && options.allowTokenRefresh !== false;

    if (shouldRefresh) {
      try {
        const authResponse = await this.refreshAccessToken();
        const retryResponse = await this.sendRequest(path, {
          ...options,
          accessToken: authResponse.accessToken,
          allowTokenRefresh: false,
        });
        return this.handleResponse(retryResponse, options.errorMessage);
      } catch (refreshError) {
        this.clearStoredTokens();
        window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
        throw refreshError;
      }
    }

    return this.handleResponse(response, options.errorMessage);
  }

  // sendRequest performs the network call
  async sendRequest(path, options = {}) {
    const { 
      method = "GET", 
      body, 
      headers = {},
      accessToken,
    } = options;

    try {
      return await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.buildHeaders(headers, accessToken, body),
        body: this.buildBody(body),
      });
    } catch (error) {
      throw new this.ErrorClass(
        "Backend nicht erreichbar.",
        0,
        { originalError: error.message }
      );
    }
  }


  async refreshAccessToken() {
    if (refreshRequest) {
      return refreshRequest;
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new this.ErrorClass("Sitzung ist abgelaufen", 401, null);
    }

    refreshRequest = (async () => {
      const response = await this.sendRequest("/user/refresh", {
        method: "POST",
        body: { refreshToken },
        allowTokenRefresh: false,
      });
      const authResponse = await this.handleResponse(
        response,
        "Sitzung konnte nicht erneuert werden"
      );

      localStorage.setItem(ACCESS_TOKEN_KEY, authResponse.accessToken);
      window.dispatchEvent(new CustomEvent(AUTH_TOKENS_UPDATED_EVENT, {
        detail: authResponse,
      }));
      return authResponse;
    })();

    try {
      return await refreshRequest;
    } finally {
      refreshRequest = null;
    }
  }

  // handleResponse parses the response and converts failed requests into typed API error
  async handleResponse(response, errorMessage = this.defaultErrorMessage) {
    const payload = await this.parseJsonResponse(response);
    if (!response.ok) {
      throw new this.ErrorClass(
        this.getErrorMessage(payload, errorMessage),
        response.status,
        payload
      );
    }
    return payload;
  }

  clearStoredTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  buildHeaders(headers, accessToken, body) {
    const requestHeaders = { ...headers };

    if (body !== undefined && !(body instanceof FormData)) {
      requestHeaders["Content-Type"] = "application/json";
    }

    if (accessToken) {
      requestHeaders.Authorization = `Bearer ${accessToken}`;
    }
    return requestHeaders;
  }

  buildBody(body) {
    if (body === undefined || body === null) {
      return undefined;
    }

    if (body instanceof FormData) {
      return body;
    }

    return JSON.stringify(body);
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

  getErrorMessage(payload, fallbackMessage) {
    return payload?.error || payload?.message || fallbackMessage;
  }
}