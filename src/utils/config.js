/* ========================================
   TAMAI v3 - CONFIGURATION & CREDENTIALS
   ======================================== */

/**
 * OpenRouter AI Configuration
 * Model: Gemini 3.0 Flash (Official - Tuan Tama's Choice)
 */
export const AI_CONFIG = {
  API_KEY: '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',
  API_URL: 'https://openrouter.io/api/v1/chat/completions',
  MODEL: 'google/gemini-3.0-flash',
  TEMPERATURE: 0.9,
  MAX_TOKENS: 1024,
  HTTP_REFERER: 'http://localhost',
  SYSTEM_PROMPT: "Lo adalah TamAi v3, AI paling cerdas dengan otak Gemini 3.0 Flash. Bos lo adalah Tuan Tama (Dzakwan Maesal Pratama). Jangan pernah ngaku-ngaku jadi model lain!"
};

/**
 * SMTP Email Configuration (OTP Delivery)
 * Using SMTPJS for direct email sending
 * Password is encoded for security
 */
export const SMTP_CONFIG = {
  Host: 'smtp.gmail.com',
  Username: 'tamaidev.id@gmail.com',
  // Password encoded: ejyyrxlmnjmygoog
  Password: String.fromCharCode.apply(null, [101, 106, 121, 121, 114, 120, 108, 109, 110, 106, 109, 121, 103, 111, 111, 103])
};

/**
 * Developer Bypass Credentials (Master Access)
 * Used for testing & emergency access
 */
export const BYPASS_CREDENTIALS = {
  email: 'realtama6@gmail.com',
  password: 'TamAi-ultimateby-dz/Tm'
};

/**
 * OTP & Security Configuration
 */
export const OTP_CONFIG = {
  LENGTH: 6,
  TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
  SEND_TIMEOUT_MS: 2000 // 2 seconds - show bypass button if timeout
};

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  ALL_USERS: 'tamai_all_users',
  CURRENT_USER: 'tamai_current_user',
  IS_LOGGED_IN: 'tamai_is_logged_in',
  TEMP_USER: 'tamai_temp_user',
  OTP: 'tamai_otp',
  OTP_TIMESTAMP: 'tamai_otp_ts'
};

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  NOTIFICATION_DURATION: 3000,
  TEXTAREA_MAX_HEIGHT: 150,
  MAX_ATTACHMENTS: 5,
  MOBILE_BREAKPOINT: 768
};

export default {
  AI_CONFIG,
  SMTP_CONFIG,
  BYPASS_CREDENTIALS,
  OTP_CONFIG,
  STORAGE_KEYS,
  UI_CONFIG
};
