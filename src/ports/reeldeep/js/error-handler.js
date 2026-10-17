// Error handling module for ReelDeep

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Custom error class for validation errors
 */
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Handle API errors
 * @param {Error} error - The error object
 * @param {Function} showMessage - Function to display error message
 * @returns {string} - User-friendly error message
 */
const handleApiError = (error, displayMessage) => {
  console.error('API Error:', error);
  
  let userMessage = 'Something went wrong. Please try again later.';
  
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        userMessage = `Invalid request: ${error.message}`;
        break;
      case 401:
        userMessage = 'Authentication failed. Please refresh the page and try again.';
        break;
      case 403:
        userMessage = 'You do not have permission to perform this action.';
        break;
      case 404:
        userMessage = 'The requested resource was not found.';
        break;
      case 429:
        userMessage = 'Too many requests. Please wait a moment and try again.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        userMessage = 'Server error. Please try again later.';
        break;
      default:
        userMessage = `Error: ${error.message}`;
    }
  } else if (error instanceof ValidationError) {
    userMessage = `Validation error: ${error.message}`;
  } else if (error.message.includes('network') || error.message.includes('connection')) {
    userMessage = 'Network error. Please check your internet connection and try again.';
  }
  
  if (displayMessage) {
    displayMessage(userMessage, 'error');
  }
  
  return userMessage;
};

/**
 * Log error to console with additional context
 * @param {Error} error - The error object
 * @param {string} context - Error context
 */
const logError = (error, context) => {
  console.group(`Error in ${context}`);
  console.error('Error:', error);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  if (error.details) {
    console.error('Details:', error.details);
  }
  console.groupEnd();
};

// Export error handling functions
export {
  ApiError,
  ValidationError,
  handleApiError,
  logError
};