// Helper utility functions

/**
 * Format date to MySQL DATETIME format
 * @param {Date} date - JavaScript Date object
 * @returns {string} - Formatted date string (YYYY-MM-DD HH:mm:ss)
 */
const formatDateTimeForMySQL = (date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Format date to MySQL DATE format
 * @param {Date} date - JavaScript Date object
 * @returns {string} - Formatted date string (YYYY-MM-DD)
 */
const formatDateForMySQL = (date = new Date()) => {
  return date.toISOString().slice(0, 10);
};

/**
 * Calculate time difference in minutes
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Difference in minutes
 */
const getMinutesDifference = (startDate, endDate = new Date()) => {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.floor(diff / (1000 * 60));
};

/**
 * Check if time is before 3 PM (matinee)
 * @param {Date} date - Date to check
 * @returns {boolean} - True if before 3 PM
 */
const isMatinee = (date) => {
  return date.getHours() < 15;
};

/**
 * Check if date is Tuesday or Wednesday
 * @param {Date} date - Date to check
 * @returns {boolean} - True if Tuesday (2) or Wednesday (3)
 */
const isWeekdayDiscount = (date) => {
  const day = date.getDay();
  return day === 2 || day === 3;
};

/**
 * Generate random alphanumeric string
 * @param {number} length - Length of string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize string to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '');
};

/**
 * Create pagination object
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} - Pagination object with offset and metadata
 */
const createPagination = (page = 1, limit = 20, total = 0) => {
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  return {
    offset,
    limit,
    page,
    totalPages,
    total,
  };
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

module.exports = {
  formatDateTimeForMySQL,
  formatDateForMySQL,
  getMinutesDifference,
  isMatinee,
  isWeekdayDiscount,
  generateRandomString,
  isValidEmail,
  sanitizeString,
  createPagination,
  formatCurrency,
};
