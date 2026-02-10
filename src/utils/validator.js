/* ========================================
   TAMAI v3 - VALIDATOR & UTILITY FUNCTIONS
   ======================================== */

import { OTP_CONFIG, STORAGE_KEYS } from './config.js';

/**
 * String & Email Validators
 */
export const Validators = {
  /**
   * Validate email format
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength (min 6 chars)
   * @param {string} password
   * @returns {boolean}
   */
  isValidPassword(password) {
    return password && password.length >= 6;
  },

  /**
   * Validate username (lowercase, no spaces)
   * @param {string} username
   * @returns {boolean}
   */
  isValidUsername(username) {
    const usernameRegex = /^[a-z0-9_]+$/;
    return usernameRegex.test(username) && username.length > 0;
  },

  /**
   * Validate OTP format (6 digits)
   * @param {string} otp
   * @returns {boolean}
   */
  isValidOTP(otp) {
    return /^\d{6}$/.test(otp);
  },

  /**
   * Validate if OTP is still valid (not expired)
   * @param {number} timestamp
   * @returns {boolean}
   */
  isOTPValid(timestamp) {
    return Date.now() - timestamp <= OTP_CONFIG.TIMEOUT_MS;
  }
};

/**
 * Storage Helpers (localStorage wrapper)
 */
export const Storage = {
  /**
   * Get all registered users
   * @returns {Array}
   */
  getAllUsers() {
    const raw = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    return raw ? JSON.parse(raw) : [];
  },

  /**
   * Save all users to storage
   * @param {Array} users
   */
  saveAllUsers(users) {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  },

  /**
   * Get current logged-in user
   * @returns {Object|null}
   */
  getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  },

  /**
   * Save current user
   * @param {Object} user
   */
  saveCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
  },

  /**
   * Check if user is logged in
   * @returns {boolean}
   */
  isLoggedIn() {
    return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
  },

  /**
   * Clear user session
   */
  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  /**
   * Get user chats
   * @param {string} email
   * @returns {Object}
   */
  getChats(email) {
    const key = `chats_${email}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  },

  /**
   * Save user chats
   * @param {string} email
   * @param {Object} chats
   */
  saveChats(email, chats) {
    const key = `chats_${email}`;
    localStorage.setItem(key, JSON.stringify(chats));
  }
};

/**
 * OTP Utilities
 */
export const OTPUtils = {
  /**
   * Generate random 6-digit OTP
   * @returns {string}
   */
  generate() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Store OTP in session storage
   * @param {string} otp
   */
  store(otp) {
    sessionStorage.setItem(STORAGE_KEYS.OTP, otp);
    sessionStorage.setItem(STORAGE_KEYS.OTP_TIMESTAMP, Date.now().toString());
  },

  /**
   * Get stored OTP
   * @returns {string|null}
   */
  get() {
    return sessionStorage.getItem(STORAGE_KEYS.OTP);
  },

  /**
   * Get OTP timestamp
   * @returns {number}
   */
  getTimestamp() {
    return parseInt(sessionStorage.getItem(STORAGE_KEYS.OTP_TIMESTAMP) || '0', 10);
  },

  /**
   * Clear OTP from session
   */
  clear() {
    sessionStorage.removeItem(STORAGE_KEYS.OTP);
    sessionStorage.removeItem(STORAGE_KEYS.OTP_TIMESTAMP);
  },

  /**
   * Check if stored OTP matches entered OTP
   * @param {string} entered
   * @returns {boolean}
   */
  verify(entered) {
    const stored = this.get();
    const timestamp = this.getTimestamp();
    
    if (!stored || !Validators.isValidOTP(entered)) return false;
    if (!Validators.isOTPValid(timestamp)) return false;
    
    return entered === stored;
  }
};

/**
 * String Utilities
 */
export const StringUtils = {
  /**
   * Truncate string to max length
   * @param {string} str
   * @param {number} maxLength
   * @returns {string}
   */
  truncate(str, maxLength = 50) {
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  },

  /**
   * Get user initials for avatar
   * @param {string} name
   * @returns {string}
   */
  getInitials(name) {
    return (name || '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
};

export default {
  Validators,
  Storage,
  OTPUtils,
  StringUtils
};
