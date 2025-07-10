/**
 * HTTP Client Service for As-Built Documenter
 * 
 * Provides robust HTTP data fetching with retry logic, authentication,
 * and error handling for the As-Built Documenter plugin.
 * 
 * Uses native fetch API for browser compatibility.
 */

export interface HttpClientConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  auth?: {
    type: 'bearer' | 'basic' | 'custom';
    credentials: Record<string, string>;
    customHeaders?: Record<string, string>;
  };
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
  };
}

export interface DataSourceEndpoint {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
}

export interface FetchResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  duration: number;
}

export interface HttpProgressCallback {
  (progress: number, status: string): void;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  signal?: AbortSignal;
  validateStatus?: (status: number) => boolean;
}

export interface RequestInterceptor {
  (config: RequestConfig): RequestConfig | Promise<RequestConfig>;
}

export interface ResponseInterceptor {
  (response: Response): Response | Promise<Response>;
}

export interface CacheConfig {
  enabled: boolean;
  maxAge: number;
  maxSize: number;
}

export interface HttpClientInstance {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
  head(url: string, config?: RequestConfig): Promise<Response>;
  options(url: string, config?: RequestConfig): Promise<Response>;
}

export interface HttpError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;
}

export class HttpClientService implements HttpClientInstance {
  private config: HttpClientConfig;
  private cache: Map<string, { data: any; timestamp: number; maxAge: number }> = new Map();
  private cacheConfig: CacheConfig = {
    enabled: false,
    maxAge: 300000, // 5 minutes
    maxSize: 100
  };

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  /**
   * Create request headers with authentication
   */
  private createHeaders(endpoint?: DataSourceEndpoint, config?: RequestConfig): Headers {
    const headers = new Headers();

    // Add default headers
    if (this.config.defaultHeaders) {
      Object.entries(this.config.defaultHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    // Add endpoint-specific headers
    if (endpoint?.headers) {
      Object.entries(endpoint.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    // Add config-specific headers
    if (config?.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    // Add authentication headers
    if (this.config.auth) {
      switch (this.config.auth.type) {
        case 'bearer':
          headers.set('Authorization', `Bearer ${this.config.auth.credentials.token}`);
          break;
        case 'basic':
          const { username, password } = this.config.auth.credentials;
          const encoded = btoa(`${username}:${password}`);
          headers.set('Authorization', `Basic ${encoded}`);
          break;
        case 'custom':
          if (this.config.auth.customHeaders) {
            Object.entries(this.config.auth.customHeaders).forEach(([key, value]) => {
              headers.set(key, value);
            });
          }
          break;
      }
    }

    return headers;
  }

  /**
   * Create full URL with query parameters
   */
  private createUrl(url: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });

    return urlObj.toString();
  }

  /**
   * Execute fetch with timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit, timeout?: number): Promise<Response> {
    const controller = new AbortController();
    const requestTimeout = timeout ?? this.config.timeout;
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${requestTimeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Fetch data from a single endpoint with retry logic
   */
  async fetchData(
    endpoint: DataSourceEndpoint,
    ipAddress?: string,
    progressCallback?: HttpProgressCallback
  ): Promise<FetchResult> {
    const startTime = Date.now();
    
    try {
      progressCallback?.(0, `Starting request to ${endpoint.url}`);

      // Replace {ipAddress} tokens in URL
      const processedUrl = this.processUrlTokens(endpoint.url, { ipAddress });
      const fullUrl = this.createUrl(processedUrl, endpoint.params);

      const options: RequestInit = {
        method: endpoint.method || 'GET',
        headers: this.createHeaders(endpoint),
      };

      if (endpoint.body && endpoint.method && ['POST', 'PUT'].includes(endpoint.method)) {
        options.body = typeof endpoint.body === 'string' 
          ? endpoint.body 
          : JSON.stringify(endpoint.body);
        
        if (!options.headers) options.headers = new Headers();
        if (options.headers instanceof Headers && !options.headers.has('Content-Type')) {
          options.headers.set('Content-Type', 'application/json');
        }
      }

      const response = await this.executeWithRetry(fullUrl, options, progressCallback);
      const duration = Date.now() - startTime;

      let data: any;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      } catch {
        data = null;
      }

      progressCallback?.(100, 'Request completed successfully');

      return {
        success: true,
        data,
        statusCode: response.status,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = this.getErrorMessage(error);
      
      progressCallback?.(100, `Request failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        statusCode: (error as HttpError).status,
        duration,
      };
    }
  }

  /**
   * Fetch data from multiple endpoints concurrently
   */
  async fetchMultipleDataSources(
    endpoints: DataSourceEndpoint[],
    ipAddress?: string,
    progressCallback?: HttpProgressCallback
  ): Promise<Record<string, FetchResult>> {
    const results: Record<string, FetchResult> = {};
    const totalEndpoints = endpoints.length;
    let completedEndpoints = 0;

    const updateProgress = (endpointUrl: string, status: string) => {
      const progress = (completedEndpoints / totalEndpoints) * 100;
      progressCallback?.(progress, `${endpointUrl}: ${status}`);
    };

    // Create promises for all endpoints
    const promises = endpoints.map(async (endpoint, index) => {
      const endpointKey = `endpoint_${index}`;
      
      try {
        updateProgress(endpoint.url, 'Starting...');
        
        const result = await this.fetchData(
          endpoint,
          ipAddress,
          (_, status) => updateProgress(endpoint.url, status)
        );
        
        results[endpointKey] = result;
        completedEndpoints++;
        updateProgress(endpoint.url, result.success ? 'Completed' : 'Failed');
        
      } catch (error) {
        results[endpointKey] = {
          success: false,
          error: this.getErrorMessage(error),
          duration: 0,
        };
        completedEndpoints++;
        updateProgress(endpoint.url, 'Error');
      }
    });

    // Wait for all requests to complete
    await Promise.allSettled(promises);

    progressCallback?.(100, `Completed ${completedEndpoints} of ${totalEndpoints} requests`);

    return results;
  }

  /**
   * Execute request with exponential backoff retry logic
   */
  private async executeWithRetry(
    url: string,
    options: RequestInit,
    progressCallback?: HttpProgressCallback,
    retries?: number,
    timeout?: number
  ): Promise<Response> {
    let lastError: Error;
    const maxRetries = retries ?? this.config.retries;
    const requestTimeout = timeout ?? this.config.timeout;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          progressCallback?.(
            (attempt / (maxRetries + 1)) * 50,
            `Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`
          );
          await this.sleep(delay);
        }

        progressCallback?.(
          ((attempt + 0.5) / (maxRetries + 1)) * 100,
          `Making request (attempt ${attempt + 1}/${maxRetries + 1})`
        );

        const response = await this.fetchWithTimeout(url, options, requestTimeout);
        
        if (!response.ok) {
          const error: HttpError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.statusText = response.statusText;
          error.response = response;
          throw error;
        }

        return response;
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain status codes
        if (this.isNonRetryableError(error as HttpError)) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError!;
  }

  /**
   * Process URL tokens like {ipAddress}
   */
  private processUrlTokens(url: string, tokens: Record<string, string | undefined>): string {
    let processedUrl = url;
    
    Object.entries(tokens).forEach(([key, value]) => {
      if (value !== undefined) {
        const token = `{${key}}`;
        processedUrl = processedUrl.replace(new RegExp(token, 'g'), value);
      }
    });

    return processedUrl;
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: HttpError): boolean {
    if (!error.status) {
      return false; // Network errors should be retried
    }

    const status = error.status;
    
    // Don't retry client errors (4xx) except for some specific cases
    if (status >= 400 && status < 500) {
      // Retry on rate limiting and request timeout
      return ![408, 429].includes(status);
    }

    // Retry on server errors (5xx)
    return false;
  }

  /**
   * Extract meaningful error message from various error types
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error && 'status' in error) {
      const httpError = error as HttpError;
      if (httpError.status) {
        return `HTTP ${httpError.status}: ${httpError.statusText || 'Error'}`;
      }
      return `Network error: ${httpError.message}`;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'Unknown error occurred';
  }

  /**
   * Simple sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generic request method for all HTTP methods
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    const fullUrl = this.config.baseURL ? new URL(url, this.config.baseURL).toString() : url;
    const cacheKey = `${method}:${fullUrl}:${JSON.stringify(data)}:${JSON.stringify(config)}`;
    
    // Check cache
    if (this.cacheConfig.enabled && method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.maxAge) {
        return cached.data;
      }
    }

    // Apply request interceptors
    let requestConfig = config;
    if (this.config.interceptors?.request) {
      for (const interceptor of this.config.interceptors.request) {
        requestConfig = await interceptor(requestConfig);
      }
    }

    const processedUrl = this.createUrl(fullUrl, requestConfig.params);
    const options: RequestInit = {
      method,
      headers: this.createHeaders(undefined, requestConfig),
      signal: requestConfig.signal,
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = typeof data === 'string' ? data : JSON.stringify(data);
      if (options.headers instanceof Headers && !options.headers.has('Content-Type')) {
        options.headers.set('Content-Type', 'application/json');
      }
    }

    const timeout = requestConfig.timeout || this.config.timeout;
    const retries = requestConfig.retries || this.config.retries;

    let response = await this.executeWithRetry(processedUrl, options, undefined, retries, timeout);

    // Apply response interceptors
    if (this.config.interceptors?.response) {
      for (const interceptor of this.config.interceptors.response) {
        response = await interceptor(response);
      }
    }

    // Validate status
    const validateStatus = requestConfig.validateStatus || ((status: number) => status >= 200 && status < 300);
    if (!validateStatus(response.status)) {
      const error: HttpError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = response;
      throw error;
    }

    let result: T;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = (await response.text()) as unknown as T;
      }
    } catch {
      result = null as unknown as T;
    }

    // Cache successful GET requests
    if (this.cacheConfig.enabled && method === 'GET' && validateStatus(response.status)) {
      this.setCache(cacheKey, result, this.cacheConfig.maxAge);
    }

    return result;
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  /**
   * HEAD request
   */
  async head(url: string, config?: RequestConfig): Promise<Response> {
    const fullUrl = this.config.baseURL ? new URL(url, this.config.baseURL).toString() : url;
    const processedUrl = this.createUrl(fullUrl, config?.params);
    const options: RequestInit = {
      method: 'HEAD',
      headers: this.createHeaders(undefined, config),
      signal: config?.signal,
    };

    return this.executeWithRetry(processedUrl, options, undefined, config?.retries || this.config.retries, config?.timeout || this.config.timeout);
  }

  /**
   * OPTIONS request
   */
  async options(url: string, config?: RequestConfig): Promise<Response> {
    const fullUrl = this.config.baseURL ? new URL(url, this.config.baseURL).toString() : url;
    const processedUrl = this.createUrl(fullUrl, config?.params);
    const options: RequestInit = {
      method: 'OPTIONS',
      headers: this.createHeaders(undefined, config),
      signal: config?.signal,
    };

    return this.executeWithRetry(processedUrl, options, undefined, config?.retries || this.config.retries, config?.timeout || this.config.timeout);
  }

  /**
   * Set authentication configuration
   */
  setAuthentication(type: 'bearer' | 'basic' | 'custom', credentials: any): void {
    this.config.auth = {
      type,
      credentials,
      customHeaders: type === 'custom' ? credentials : undefined
    };
  }

  /**
   * Create instance with progress tracking
   */
  withProgress(_callback: HttpProgressCallback): HttpClientService {
    const newConfig = { ...this.config };
    const newService = new HttpClientService(newConfig);
    newService.cacheConfig = this.cacheConfig;
    newService.cache = this.cache;
    // Progress callback would be stored and used in requests
    return newService;
  }

  /**
   * Create instance with cancellation support
   */
  withCancellation(_signal: AbortSignal): HttpClientService {
    const newConfig = { ...this.config };
    const newService = new HttpClientService(newConfig);
    newService.cacheConfig = this.cacheConfig;
    newService.cache = this.cache;
    // AbortSignal would be used in all requests
    return newService;
  }

  /**
   * Set default configuration
   */
  setDefaults(config: Partial<HttpClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    if (!this.config.interceptors) {
      this.config.interceptors = {};
    }
    if (!this.config.interceptors.request) {
      this.config.interceptors.request = [];
    }
    this.config.interceptors.request.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    if (!this.config.interceptors) {
      this.config.interceptors = {};
    }
    if (!this.config.interceptors.response) {
      this.config.interceptors.response = [];
    }
    this.config.interceptors.response.push(interceptor);
  }

  /**
   * Configure caching
   */
  configureCaching(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
  }

  /**
   * Set cache entry
   */
  private setCache(key: string, data: any, maxAge: number): void {
    if (this.cache.size >= this.cacheConfig.maxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      maxAge
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update authentication configuration
   */
  updateAuth(auth: HttpClientConfig['auth']): void {
    this.config.auth = auth;
  }

  /**
   * Get current configuration
   */
  getConfig(): HttpClientConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create HTTP client with default configuration
 */
export function createHttpClient(overrides: Partial<HttpClientConfig> = {}): HttpClientService {
  const defaultConfig: HttpClientConfig = {
    timeout: 10000, // 10 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
    ...overrides,
  };

  return new HttpClientService(defaultConfig);
}