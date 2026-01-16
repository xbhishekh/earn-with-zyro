import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  cumulativeLayoutShift: number;
}

interface PerformanceEntry {
  timestamp: number;
  route: string;
  metrics: Partial<PerformanceMetrics>;
  type: 'navigation' | 'resource' | 'api';
}

// Global performance log (accessible from admin panel)
const performanceLog: PerformanceEntry[] = [];
const MAX_LOG_ENTRIES = 100;

export const getPerformanceLog = () => [...performanceLog];

export const clearPerformanceLog = () => {
  performanceLog.length = 0;
};

export const usePerformanceMonitor = (routeName?: string) => {
  const startTimeRef = useRef(performance.now());

  const logMetric = useCallback((type: PerformanceEntry['type'], metrics: Partial<PerformanceMetrics>) => {
    const entry: PerformanceEntry = {
      timestamp: Date.now(),
      route: routeName || window.location.pathname,
      metrics,
      type,
    };
    
    performanceLog.unshift(entry);
    
    // Keep log size manageable
    if (performanceLog.length > MAX_LOG_ENTRIES) {
      performanceLog.pop();
    }

    // Log slow operations
    const loadTime = metrics.pageLoadTime || 0;
    if (loadTime > 3000) {
      console.warn(`[Performance] Slow ${type} on ${entry.route}: ${loadTime.toFixed(0)}ms`);
    }
  }, [routeName]);

  const measureApiCall = useCallback(async function<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      
      logMetric('api', { pageLoadTime: duration });
      
      if (duration > 1000) {
        console.warn(`[Performance] Slow API call "${name}": ${duration.toFixed(0)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logMetric('api', { pageLoadTime: duration });
      throw error;
    }
  }, [logMetric]);

  useEffect(() => {
    // Measure page navigation time
    const measureNavigation = () => {
      const loadTime = performance.now() - startTimeRef.current;
      logMetric('navigation', { pageLoadTime: loadTime });
    };

    // Use requestIdleCallback for non-blocking measurement
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(measureNavigation);
    } else {
      setTimeout(measureNavigation, 100);
    }

    // Measure Core Web Vitals if available
    if ('PerformanceObserver' in window) {
      try {
        // LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            logMetric('navigation', { largestContentfulPaint: lastEntry.startTime });
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // FCP
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              logMetric('navigation', { firstContentfulPaint: entry.startTime });
            }
          });
        });
        fcpObserver.observe({ type: 'paint', buffered: true });

        // CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutEntry = entry as unknown as { hadRecentInput: boolean; value: number };
            if (!layoutEntry.hadRecentInput) {
              clsValue += layoutEntry.value;
            }
          }
          logMetric('navigation', { cumulativeLayoutShift: clsValue });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        return () => {
          lcpObserver.disconnect();
          fcpObserver.disconnect();
          clsObserver.disconnect();
        };
      } catch {
        // Some browsers don't support all observer types
      }
    }
  }, [logMetric]);

  return { measureApiCall, logMetric };
};

// Performance summary for admin panel
export const getPerformanceSummary = () => {
  const log = getPerformanceLog();
  
  if (log.length === 0) {
    return {
      avgPageLoad: 0,
      avgApiResponse: 0,
      slowPages: [] as { route: string; time: number | undefined }[],
      slowApis: [] as { route: string; time: number | undefined }[],
      totalRequests: 0,
    };
  }

  const navigationEntries = log.filter(e => e.type === 'navigation');
  const apiEntries = log.filter(e => e.type === 'api');

  const avgPageLoad = navigationEntries.length > 0
    ? navigationEntries.reduce((sum, e) => sum + (e.metrics.pageLoadTime || 0), 0) / navigationEntries.length
    : 0;

  const avgApiResponse = apiEntries.length > 0
    ? apiEntries.reduce((sum, e) => sum + (e.metrics.pageLoadTime || 0), 0) / apiEntries.length
    : 0;

  const slowPages = navigationEntries
    .filter(e => (e.metrics.pageLoadTime || 0) > 2000)
    .slice(0, 5)
    .map(e => ({ route: e.route, time: e.metrics.pageLoadTime }));

  const slowApis = apiEntries
    .filter(e => (e.metrics.pageLoadTime || 0) > 500)
    .slice(0, 5)
    .map(e => ({ route: e.route, time: e.metrics.pageLoadTime }));

  return {
    avgPageLoad: Math.round(avgPageLoad),
    avgApiResponse: Math.round(avgApiResponse),
    slowPages,
    slowApis,
    totalRequests: log.length,
  };
};
