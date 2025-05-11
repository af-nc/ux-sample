// Track which endpoints are unavailable
export const unavailableEndpoints = new Set();

// Global loading state management
export const loadingStates = {
    table: false,
    feedback: false
};

// API Configuration
export const API_CONFIG = {
    baseUrl: window.API_GATEWAY_URL || 'https://trlf1mzdd8.execute-api.us-east-1.amazonaws.com/prod',
    headers: {
        'Content-Type': 'application/json'
    }
}; 
