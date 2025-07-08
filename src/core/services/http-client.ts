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
    type: 'bearer' | 'basic';
    credentials: Record<string, string>;
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

export interface ProgressCallback {
  (progress: number, status: string): void;
}

export interface HttpError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;
}

export class HttpClientService {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  /**
   * Create request headers with authentication
   */
  private createHeaders(endpoint: DataSourceEndpoint): Headers {
    const headers = new Headers(endpoint.headers);

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
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

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
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
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
    progressCallback?: ProgressCallback
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
    progressCallback?: ProgressCallback
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
    progressCallback?: ProgressCallback
  ): Promise<Response> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          progressCallback?.(
            (attempt / (this.config.retries + 1)) * 50,
            `Retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.retries + 1})`
          );
          await this.sleep(delay);
        }

        progressCallback?.(
          ((attempt + 0.5) / (this.config.retries + 1)) * 100,
          `Making request (attempt ${attempt + 1}/${this.config.retries + 1})`
        );

        const response = await this.fetchWithTimeout(url, options);
        
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
        
        if (attempt === this.config.retries) {
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