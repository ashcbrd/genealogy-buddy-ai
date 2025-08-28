"use client";

import { useState } from 'react';
import { useUsageData } from './use-user-status';

interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

interface SecurityHeaders {
  'x-usage-current'?: string;
  'x-usage-limit'?: string;
  'x-usage-remaining'?: string;
  'x-ratelimit-reset'?: string;
  'retry-after'?: string;
}

interface AnalysisResult<T> {
  data?: T;
  error?: string;
  loading: boolean;
  usageInfo?: {
    current: number;
    limit: number;
    remaining: number;
  };
  securityInfo?: {
    rateLimited: boolean;
    resetAt?: Date;
    retryAfter?: number;
  };
}

/**
 * Enhanced hook for making API requests to analysis endpoints
 * Includes automatic usage refresh, security validation, and error handling
 */
export function useAnalysisWithRefresh<T = any>(endpoint: string) {
  const [result, setResult] = useState<AnalysisResult<T>>({
    loading: false
  });
  
  const { refresh: refreshUsage } = useUsageData();

  const makeRequest = async (
    formData?: FormData,
    options?: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    }
  ): Promise<AnalysisResult<T>> => {
    
    setResult(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      const requestOptions: RequestInit = {
        method: options?.method || (formData ? 'POST' : 'GET'),
        ...options,
      };

      if (formData) {
        requestOptions.body = formData;
      } else if (options?.body) {
        requestOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        requestOptions.headers = {
          'Content-Type': 'application/json',
          ...options?.headers,
        };
      }

      const response = await fetch(endpoint, requestOptions);
      
      // Extract security headers
      const headers = response.headers;
      const securityHeaders: SecurityHeaders = {};
      
      ['x-usage-current', 'x-usage-limit', 'x-usage-remaining', 'x-ratelimit-reset', 'retry-after'].forEach(header => {
        const value = headers.get(header);
        if (value) {
          securityHeaders[header as keyof SecurityHeaders] = value;
        }
      });

      // Parse usage info from headers
      const usageInfo = securityHeaders['x-usage-current'] ? {
        current: parseInt(securityHeaders['x-usage-current']),
        limit: parseInt(securityHeaders['x-usage-limit'] || '0'),
        remaining: parseInt(securityHeaders['x-usage-remaining'] || '0'),
      } : undefined;

      // Parse security info from headers
      const securityInfo = response.status === 429 ? {
        rateLimited: true,
        resetAt: securityHeaders['x-ratelimit-reset'] ? new Date(securityHeaders['x-ratelimit-reset']) : undefined,
        retryAfter: securityHeaders['retry-after'] ? parseInt(securityHeaders['retry-after']) : undefined,
      } : undefined;

      if (response.ok) {
        const data = await response.json();
        
        const successResult: AnalysisResult<T> = {
          data,
          loading: false,
          usageInfo,
          securityInfo
        };

        setResult(successResult);
        
        // Refresh usage data after successful analysis
        if (usageInfo) {
          await refreshUsage();
        }
        
        return successResult;
      } else {
        // Handle error response
        let errorData: ApiError;
        
        try {
          errorData = await response.json();
        } catch {
          errorData = { 
            error: getStatusErrorMessage(response.status),
            code: getStatusErrorCode(response.status)
          };
        }

        const errorMessage = getErrorMessage(response.status, errorData);
        
        const errorResult: AnalysisResult<T> = {
          error: errorMessage,
          loading: false,
          usageInfo,
          securityInfo
        };

        setResult(errorResult);
        return errorResult;
      }
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      let errorMessage = 'Network error occurred';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      const networkErrorResult: AnalysisResult<T> = {
        error: errorMessage,
        loading: false
      };

      setResult(networkErrorResult);
      return networkErrorResult;
    }
  };

  return {
    ...result,
    execute: makeRequest,
    reset: () => setResult({ loading: false })
  };
}

function getStatusErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Please sign in to use this feature.';
    case 402:
      return 'This feature is not available in your current plan. Please upgrade to continue.';
    case 403:
      return 'Access denied. Please check your permissions.';
    case 404:
      return 'Service not found. Please try again later.';
    case 408:
      return 'Request timed out. Please try again.';
    case 413:
      return 'File is too large. Please upload a smaller file.';
    case 415:
      return 'File type not supported. Please upload a different file format.';
    case 429:
      return 'Too many requests. Please wait before trying again.';
    case 500:
      return 'Server error occurred. Please try again later.';
    case 502:
      return 'Service temporarily unavailable. Please try again in a few minutes.';
    case 503:
      return 'Service is currently down for maintenance. Please try again later.';
    case 504:
      return 'Service timed out. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

function getStatusErrorCode(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 402:
      return 'PAYMENT_REQUIRED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 408:
      return 'REQUEST_TIMEOUT';
    case 413:
      return 'FILE_TOO_LARGE';
    case 415:
      return 'UNSUPPORTED_FILE_TYPE';
    case 429:
      return 'RATE_LIMITED';
    case 500:
      return 'INTERNAL_ERROR';
    case 502:
      return 'BAD_GATEWAY';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    case 504:
      return 'GATEWAY_TIMEOUT';
    default:
      return 'UNKNOWN_ERROR';
  }
}

function getErrorMessage(status: number, errorData: ApiError): string {
  // Use server-provided error message if available and meaningful
  if (errorData.error && 
      !errorData.error.toLowerCase().includes('internal server error') &&
      !errorData.error.toLowerCase().includes('something went wrong')) {
    return errorData.error;
  }

  // Fall back to status-based messages
  return getStatusErrorMessage(status);
}

/**
 * Legacy hook that provides a function to refresh usage data after successful analysis
 * This ensures the usage display updates in real-time without needing a page reload
 * @deprecated Use useAnalysisWithRefresh instead for better security validation
 */
export function useSimpleAnalysisRefresh() {
  const { refresh: refreshUsage } = useUsageData();

  /**
   * Call this function after a successful analysis to immediately update usage display
   * Usage: await refreshUsageAfterAnalysis();
   */
  const refreshUsageAfterAnalysis = async () => {
    try {
      await refreshUsage();
    } catch (error) {
      console.error('Failed to refresh usage data after analysis:', error);
    }
  };

  return { refreshUsageAfterAnalysis };
}