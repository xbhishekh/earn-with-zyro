import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  showToast?: boolean;
  toastErrorMessage?: string;
  toastSuccessMessage?: string;
  onRetry?: (attempt: number) => void;
}

interface RetryState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  retryCount: number;
}

export function useNetworkRetry<T>(
  asyncFn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    showToast = true,
    toastErrorMessage = "Request failed. Please try again.",
    toastSuccessMessage,
    onRetry,
  } = options;

  const [state, setState] = useState<RetryState<T>>({
    data: null,
    error: null,
    isLoading: false,
    retryCount: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          onRetry?.(attempt);
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
          );
        }

        const result = await asyncFn();
        
        setState({
          data: result,
          error: null,
          isLoading: false,
          retryCount: attempt,
        });

        if (showToast && toastSuccessMessage && attempt > 0) {
          toast.success(toastSuccessMessage);
        }

        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        
        // Don't retry on abort
        if (lastError.name === "AbortError") {
          setState(prev => ({ ...prev, isLoading: false }));
          return null;
        }

        console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError);
      }
    }

    setState({
      data: null,
      error: lastError,
      isLoading: false,
      retryCount: maxRetries,
    });

    if (showToast) {
      toast.error(toastErrorMessage, {
        action: {
          label: "Retry",
          onClick: () => execute(),
        },
      });
    }

    return null;
  }, [asyncFn, maxRetries, retryDelay, showToast, toastErrorMessage, toastSuccessMessage, onRetry]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      data: null,
      error: null,
      isLoading: false,
      retryCount: 0,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
    retry: execute,
  };
}

// Standalone retry function for one-off calls
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, "onRetry"> = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, showToast = true, toastErrorMessage = "Request failed" } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
        );
      }
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`Retry ${attempt + 1}/${maxRetries + 1} failed:`, lastError);
    }
  }

  if (showToast) {
    toast.error(toastErrorMessage);
  }

  throw lastError;
}

// Helper to wrap supabase queries with retry
export async function supabaseRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  errorMessage = "Failed to load data"
): Promise<T | null> {
  try {
    return await fetchWithRetry(async () => {
      const { data, error } = await queryFn();
      if (error) throw error;
      return data;
    }, { toastErrorMessage: errorMessage });
  } catch {
    return null;
  }
}
