// Phone validation utilities - safe for client components

// Function to validate phone number format
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic validation for E.164 format
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
}
