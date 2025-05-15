/**
 * Utility functions for formatting data in the application
 */

/**
 * Format a currency value to USD format
 * @param value Number to format as currency
 * @param locale Locale for formatting (default: 'en-US')
 * @param currency Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  locale = "en-US",
  currency = "USD"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a date to a readable string
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions
 * @param locale Locale for formatting (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  locale = "en-US"
): string {
  const dateToFormat = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateToFormat);
}

/**
 * Format a date to a relative string (e.g., "2 days ago")
 * @param date Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | number): string {
  const dateToFormat = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateToFormat.getTime();
  
  // Convert to appropriate units
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);
  
  if (diffSecs < 60) {
    return `${diffSecs} seconds ago`;
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  } else {
    return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
  }
}
