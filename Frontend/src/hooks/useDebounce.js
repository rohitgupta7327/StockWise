import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce value changes (e.g. search input).
 * Avoids triggering renders and API calls on every keystroke.
 * @param {any} value Value to debounce
 * @param {number} delay Delay in milliseconds (default 300ms)
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
