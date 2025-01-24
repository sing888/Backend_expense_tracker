// utils/responseSchema.js

/**
 * Generate a success response schema
 * @param {string} message - Success message
 * @param {object} data - Optional data to include in the response
 * @returns {object} Success response object
 */
function successResponse(message, data = {}) {
    return {
        success: true,
        message,
        data
    };
}

/**
 * Generate an error response schema
 * @param {string} message - Error message
 * @param {string} error - Optional error details
 * @returns {object} Error response object
 */
function errorResponse(message, error = null) {
    return {
        success: false,
        message,
        error
    };
}

module.exports = { successResponse, errorResponse };
