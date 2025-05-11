import { loadingStates, unavailableEndpoints } from './config.js';

// Format clinic names for display
export function formatClinicName(clinic) {
    return clinic;
}

// Format date for display
export function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Function to handle API status visibility with specific message
export function showApiStatus() {
    const banner = $('#apiStatusBanner');
    const statusText = banner.find('.api-status-text');

    if (unavailableEndpoints.size > 0) {
        const endpoints = Array.from(unavailableEndpoints);
        let message = 'API is currently unavailable. ';
        if (endpoints.length === 1) {
            message += `${endpoints[0]} data is using sample data.`;
        } else if (endpoints.length === 2) {
            message += `${endpoints[0]} and ${endpoints[1]} data are using sample data.`;
        } else {
            message += `${endpoints.join(', ')} data are using sample data.`;
        }
        statusText.text(message);
    } else {
        statusText.text('API is currently unavailable. Showing sample data.');
    }

    banner.show();
}

// Enhanced loading state management
export function updateLoadingState() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    
    // Guard clause for missing elements
    if (!loadingOverlay || !loadingText) {
        console.warn('Loading overlay elements not found in DOM');
        return;
    }
    
    if (loadingStates.table || loadingStates.feedback) {
        loadingOverlay.style.display = 'flex';
        loadingText.textContent = loadingStates.feedback ? 'Updating feedback...' : 'Loading data...';
    } else {
        loadingOverlay.style.display = 'none';
    }
}

export function showLoading(type) {
    loadingStates[type] = true;
    updateLoadingState();
}

export function hideLoading(type) {
    loadingStates[type] = false;
    updateLoadingState();
} 