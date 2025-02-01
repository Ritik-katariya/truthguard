// API URL from environment variable with fallback
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Other configuration constants
export const API_TIMEOUT = 120000; // 2 minutes
export const MAX_HISTORY_ITEMS = 50;

// API endpoints
export const ENDPOINTS = {
    CHECK: '/check',
    STATUS: '/status'
};

// App configuration
export const APP_CONFIG = {
    name: 'TruthGuard',
    version: '1.0.0',
    description: 'Your trusted content verification platform'
};
