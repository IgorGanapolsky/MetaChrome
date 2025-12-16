// Performance monitoring utilities

export const measurePerformance = (label: string, fn: () => void) => {
  if (__DEV__) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  } else {
    fn();
  }
};

export const measureAsync = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  if (__DEV__) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return fn();
};

// Performance markers for React DevTools Profiler
export const markStart = (label: string) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${label}-start`);
  }
};

export const markEnd = (label: string) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${label}-end`);
    try {
      performance.measure(label, `${label}-start`, `${label}-end`);
    } catch (e) {
      // Ignore if marks don't exist
    }
  }
};
