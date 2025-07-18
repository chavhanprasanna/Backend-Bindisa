/**
 * API Endpoints Configuration
 * This file contains all the API endpoints used in the application
 * Organized by feature/module for better maintainability
 */

const API_PREFIX = '/api/v1';

// Authentication Endpoints
export const AUTH_ENDPOINTS = {
  // OTP Authentication
  SEND_OTP: `${API_PREFIX}/auth/otp/send`,
  VERIFY_OTP: `${API_PREFIX}/auth/otp/verify`,
  REFRESH_TOKEN: `${API_PREFIX}/auth/refresh-token`,

  // Email/Password Authentication
  REGISTER: `${API_PREFIX}/auth/register`,
  LOGIN: `${API_PREFIX}/auth/login`,
  FORGOT_PASSWORD: `${API_PREFIX}/auth/forgot-password`,
  RESET_PASSWORD: `${API_PREFIX}/auth/reset-password`,

  // Social Authentication
  GOOGLE_AUTH: `${API_PREFIX}/auth/google`,
  FACEBOOK_AUTH: `${API_PREFIX}/auth/facebook`,

  // Account Management
  LOGOUT: `${API_PREFIX}/auth/logout`,
  ME: `${API_PREFIX}/auth/me`,
  UPDATE_PROFILE: `${API_PREFIX}/auth/profile`,
  CHANGE_PASSWORD: `${API_PREFIX}/auth/change-password`,
  DEACTIVATE_ACCOUNT: `${API_PREFIX}/auth/deactivate`
};

// User Management Endpoints
export const USER_ENDPOINTS = {
  BASE: `${API_PREFIX}/users`,
  BY_ID: (userId) => `${API_PREFIX}/users/${userId}`,
  SEARCH: `${API_PREFIX}/users/search`,
  UPDATE_STATUS: (userId) => `${API_PREFIX}/users/${userId}/status`,
  UPDATE_ROLE: (userId) => `${API_PREFIX}/users/${userId}/role`,
  UPLOAD_AVATAR: (userId) => `${API_PREFIX}/users/${userId}/avatar`
};

// File Upload Endpoints
export const UPLOAD_ENDPOINTS = {
  SINGLE: `${API_PREFIX}/upload`,
  MULTIPLE: `${API_PREFIX}/upload/multiple`,
  DELETE: (fileId) => `${API_PREFIX}/upload/${fileId}`,
  GET_FILE: (fileId) => `${API_PREFIX}/files/${fileId}`,
  GET_FILE_BY_KEY: (key) => `${API_PREFIX}/files/key/${key}`
};

// Notification Endpoints
export const NOTIFICATION_ENDPOINTS = {
  BASE: `${API_PREFIX}/notifications`,
  MARK_AS_READ: (notificationId) => `${API_PREFIX}/notifications/${notificationId}/read`,
  MARK_ALL_READ: `${API_PREFIX}/notifications/mark-all-read`,
  UNREAD_COUNT: `${API_PREFIX}/notifications/unread-count`,
  PREFERENCES: `${API_PREFIX}/notifications/preferences`
};

// Settings Endpoints
export const SETTINGS_ENDPOINTS = {
  APP: `${API_PREFIX}/settings/app`,
  EMAIL: `${API_PREFIX}/settings/email`,
  STORAGE: `${API_PREFIX}/settings/storage`,
  AUTH: `${API_PREFIX}/settings/auth`,
  LOGGING: `${API_PREFIX}/settings/logging`,
  BACKUP: `${API_PREFIX}/settings/backup`
};

// Audit Logs Endpoints
export const AUDIT_LOG_ENDPOINTS = {
  BASE: `${API_PREFIX}/audit-logs`,
  BY_ID: (logId) => `${API_PREFIX}/audit-logs/${logId}`,
  EXPORT: `${API_PREFIX}/audit-logs/export`
};

// API Keys Endpoints
export const API_KEY_ENDPOINTS = {
  BASE: `${API_PREFIX}/api-keys`,
  BY_ID: (keyId) => `${API_PREFIX}/api-keys/${keyId}`,
  REGENERATE: (keyId) => `${API_PREFIX}/api-keys/${keyId}/regenerate`,
  PERMISSIONS: `${API_PREFIX}/api-keys/permissions`
};

// Webhook Endpoints
export const WEBHOOK_ENDPOINTS = {
  BASE: `${API_PREFIX}/webhooks`,
  BY_ID: (webhookId) => `${API_PREFIX}/webhooks/${webhookId}`,
  TEST: (webhookId) => `${API_PREFIX}/webhooks/${webhookId}/test`,
  EVENTS: `${API_PREFIX}/webhooks/events`
};

// Health Check Endpoint
export const HEALTH_CHECK = `${API_PREFIX}/health`;

// API Documentation
export const API_DOCS = '/api-docs';

// Export all endpoints as a single object
export default {
  AUTH: AUTH_ENDPOINTS,
  USER: USER_ENDPOINTS,
  UPLOAD: UPLOAD_ENDPOINTS,
  NOTIFICATION: NOTIFICATION_ENDPOINTS,
  SETTINGS: SETTINGS_ENDPOINTS,
  AUDIT_LOG: AUDIT_LOG_ENDPOINTS,
  API_KEY: API_KEY_ENDPOINTS,
  WEBHOOK: WEBHOOK_ENDPOINTS,
  HEALTH_CHECK,
  API_DOCS
};
