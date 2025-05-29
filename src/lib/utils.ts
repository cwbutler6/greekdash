import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatDateFns } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency (USD)
 * @param amount - Number to format as currency
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date in a readable format
 * @param date - Date to format
 * @param formatString - Optional format string (defaults to MMM d, yyyy)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, formatString: string = 'MMM d, yyyy'): string {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDateFns(dateObj, formatString);
  } catch {
    return 'Invalid date';
  }
}
