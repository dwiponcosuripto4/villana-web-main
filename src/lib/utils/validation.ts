/**
 * Validation utilities for form inputs and data validation
 */

import { validatePhone } from "./phoneNumberValidator";

/**
 * Regular expression for validating international phone numbers
 * Supports formats like: +62-813-xxxx-xxxx, +1-555-123-4567, +44 20 7946 0958
 * Allows optional country code (+), digits, spaces, hyphens, parentheses, and dots
 * Length: 8-20 characters total
 */
export const PHONE_NUMBER_REGEX = /^\+?[\d\s\-\(\)\.]{8,20}$/;

/**
 * Validates a phone number using international format standards
 * @param phoneNumber - The phone number string to validate
 * @returns true if the phone number is valid, false otherwise
 *
 * @example
 * validatePhoneNumber("+62-813-1234-5678") // true
 * validatePhoneNumber("+1-555-123-4567") // true
 * validatePhoneNumber("123") // false
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return false;
  }

  // return PHONE_NUMBER_REGEX.test(phoneNumber.trim());
  const validation = validatePhone(phoneNumber);
  return validation.isValid;
}

/**
 * Gets the regex pattern for HTML input validation
 * @returns The regex pattern as a string for use in HTML pattern attributes
 */
export function getPhoneValidationPattern(): string {
  return PHONE_NUMBER_REGEX.source;
}

const LAT_LON_REGEX = /^-?[1-8]?[0-9]+[,\.]\d+$/;

/**
 * Gets the regex pattern for validating latitude and longitude values
 * @returns The regex pattern as a string for latitude/longitude validation
 */
export function getLatLonValidationPattern(): string {
  return LAT_LON_REGEX.source;
}

export function isLatLonValid(value: string): boolean {
  return LAT_LON_REGEX.test(value);
}

/**
 * Gets a standardized error message for phone number validation
 * @returns A user-friendly error message explaining phone number format requirements
 */
export function getPhoneValidationMessage(): string {
  return "Please enter a valid phone number with optional country code (8-20 digits)";
}

/**
 * Gets a standardized title/help text for phone number inputs
 * @returns Help text explaining the expected phone number format
 */
export function getPhoneInputTitle(): string {
  return "Please enter a valid phone number (8-20 digits with optional country code, spaces, hyphens, parentheses)";
}

/**
 * Gets a placeholder text for phone number inputs
 * @returns Example phone number formats
 */
export function getPhoneInputPlaceholder(): string {
  return "+62-813-xxxx-xxxx or +1-555-123-4567";
}

/**
 * Gets helper text for phone number inputs
 * @returns Instructional text about country codes
 */
export function getPhoneInputHelperText(): string {
  return "Include country code (e.g., +62 for Indonesia, +1 for US)";
}
