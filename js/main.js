import { initializeDoctorTable, initializeClinicTable, loadDataWithFallback, initializeSharedPagination } from './modules/tables.js';
import { initializeNavigation } from './modules/navigation.js';
import { initializeContactForm } from './modules/contact.js';
import { API_CONFIG } from './modules/config.js';
import { handleAvailabilityFeedback } from './modules/feedback.js';
import { showTermsOfService, showPrivacyPolicy } from './modules/navigation.js';

// Make functions globally available
window.handleAvailabilityFeedback = handleAvailabilityFeedback;
window.showTermsOfService = showTermsOfService;
window.showPrivacyPolicy = showPrivacyPolicy;

$(document).ready(function () {
    // Initialize tables
    const doctorTable = initializeDoctorTable();
    
    // Load clinic data and initialize clinic table
    loadDataWithFallback(
        `${API_CONFIG.baseUrl}/clinics`,
        'clinics.json',
        'Clinics'
    ).then(clinicData => {
        const clinicTable = initializeClinicTable(clinicData);
        
        // Initialize navigation with both tables
        initializeNavigation(doctorTable, clinicTable);
        
        // Initialize shared pagination
        initializeSharedPagination(doctorTable, clinicTable);
        
        // Global search functionality
        $('#globalSearch').on('keyup', function () {
            const searchValue = $(this).val();
            doctorTable.search(searchValue).draw();
            clinicTable.search(searchValue).draw();
        });
    });

    // Initialize contact form
    initializeContactForm();
}); 
