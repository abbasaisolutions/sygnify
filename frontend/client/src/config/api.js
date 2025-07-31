// API Configuration
export const API_BASE_URL = 'http://localhost:8000';
export const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');
export const WS_ENDPOINT = `${WS_BASE_URL}/ws`;
export const WS_JOB_ENDPOINT = (jobId) => `${WS_BASE_URL}/ws/job/${jobId}`;

// API Endpoints
export const FINANCIAL_API = `${API_BASE_URL}/financial`;

export const ENDPOINTS = {
  // Financial Analytics
  upload: `${FINANCIAL_API}/upload`,
  analyze: `${FINANCIAL_API}/analyze`,
  insights: `${FINANCIAL_API}/insights`, // Requires job_id parameter
  startJob: `${FINANCIAL_API}/start-job`,
  jobStatus: (jobId) => `${FINANCIAL_API}/status/${jobId}`,
  
  // WebSocket endpoints
  websocket: WS_ENDPOINT,
  jobWebsocket: WS_JOB_ENDPOINT,
  
  // Health and status
  health: `${API_BASE_URL}/health`,
  docs: `${API_BASE_URL}/docs`,
}; 