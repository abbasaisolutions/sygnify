// Centralized API endpoints for Sygnify Analytics Hub

export const API_BASE_URL = 'http://localhost:8000';
export const FINANCIAL_API = `${API_BASE_URL}/financial`;
export const AUTH_API = `${API_BASE_URL}/auth`;

export const ENDPOINTS = {
  results: `${FINANCIAL_API}/results`,
  insights: `${FINANCIAL_API}/insights`,
  upload: `${FINANCIAL_API}/upload`,
  subscriptionStatus: `${FINANCIAL_API}/subscription/status`,
  subscriptionCheckout: `${FINANCIAL_API}/subscription/create-checkout-session`,
  login: `${AUTH_API}/login`,
  register: `${AUTH_API}/register`,
  clearCache: `${FINANCIAL_API}/clear-cache`,
}; 