import axios, { AxiosError, AxiosResponse } from 'axios';

type ApiResponse = {
  data: any | undefined,
  errors: Map<string, string[]> | undefined,
  success: boolean,
  statusCode: number,
  errorMessage: string | undefined
}

type ValidationResponse = {
  [key: string]: string[];
};

class ApiClient {
  private tenant: string;

  constructor(tenant: string) {
    this.tenant = tenant;
  }

  private getHeaders(): { [key: string]: string } {
    return {
      '___tenant___': this.tenant,
      'Content-Type': 'application/json',
    };
  }

  private createErrorMap(key: string, messages: string[]): Map<string, string[]> {
    const errors = new Map<string, string[]>();
    errors.set(key, messages);
    return errors;
  }

  private handleErrorResponse(status: number, data: any): Map<string, string[]> {
    switch (status) {
      case 400:
        if (data) {
          const validationErrors: ValidationResponse = typeof data === 'string' ? JSON.parse(data) : data;
          return new Map(Object.entries(validationErrors));
        }
        return this.createErrorMap('BAD_REQUEST', ['Invalid request']);
      case 403:
        return this.createErrorMap('FORBIDDEN', ['Access Denied']);
      case 404:
        return this.createErrorMap('NOT_FOUND', ['Not found']);
      case 429:
        return this.createErrorMap('RATE_LIMIT', ['Rate limit exceeded']);
      default:
        return this.createErrorMap('ERROR', ['An unhandled error occurred']);
    }
  }

  private createApiResponse(success: boolean, status: number, data?: any, errors?: Map<string, string[]>): ApiResponse {
    return {
      data,
      errors,
      success,
      statusCode: status,
      errorMessage: errors ? this.buildErrorString(errors) : undefined
    };
  }

  private handleAxiosResponse(response: AxiosResponse<any>): ApiResponse {
    if (response.status >= 200 && response.status < 300) {
      return this.createApiResponse(true, response.status, response.data);
    }
    const errors = this.handleErrorResponse(response.status, response.data);
    return this.createApiResponse(false, response.status, undefined, errors);
  }

  private handleAxiosError(error: AxiosError): ApiResponse {
    if (error.response) {
      const errors = this.handleErrorResponse(error.response.status, error.response.data);
      return this.createApiResponse(false, error.response.status, undefined, errors);
    }
    return this.createApiResponse(false, 500, undefined, this.createErrorMap('ERROR', [error.message]));
  }

  private buildErrorString(errors: Map<string, string[]>): string {
    return Array.from(errors.entries())
      .map(([key, values]) => `${key}: ${values.join(", ")}`)
      .join('\n');
  }

  async getData(endpoint: string): Promise<ApiResponse> {
    try {
      const response = await axios.get(endpoint, { headers: this.getHeaders() });
      return this.handleAxiosResponse(response);
    } catch (error) {
      console.error('Error fetching data:', error);
      return error instanceof AxiosError ? this.handleAxiosError(error) : this.createApiResponse(false, 500, undefined, this.createErrorMap('ERROR', ['An unknown error occurred']));
    }
  }

  async postData(endpoint: string, data: any): Promise<ApiResponse> {
    try {
      const response = await axios.post(endpoint, data, { headers: this.getHeaders() });
      return this.handleAxiosResponse(response);
    } catch (error) {
      console.error('Error posting data:', error);
      return error instanceof AxiosError ? this.handleAxiosError(error) : this.createApiResponse(false, 500, undefined, this.createErrorMap('ERROR', ['An unknown error occurred']));
    }
  }
}

export default ApiClient;