const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";


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
  
  async request(path, options = {}) {
    const { 
      method = "GET", 
      body, 
      headers = {},
      accessToken,
      errorMessage = this.defaultErrorMessage,
    } = options;


    let response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
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

    const payload = await this.parseJsonResponse(response);

    if (!response.ok) {
      throw new this.ErrorClass(
        this.getErrorMessage(payload, errorMessage),
        response.status,
        payload
      );
    }

    return payload;;
  }

  buildHeaders(headers, accessToken, body) {
    const requestHeaders = { ...headers };

    if (body !== undefined && !(body instanceof FormData)) {
      requestHeaders["Content-Type"] = "application/json";
    }

    if (accessToken) {
      requestHeaders.accessToken = `Bearer ${accessToken}`;
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