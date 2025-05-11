import { API_CONFIG, unavailableEndpoints } from './config.js';
import { showApiStatus } from './utils.js';
import { showLoading, hideLoading } from './utils.js';

// Function to handle availability feedback
export async function handleAvailabilityFeedback(entityId, agree) {
    showLoading('feedback');

    try {
        // Determine entity type from the active table, but use hardcoded API paths
        const isClinicTable = $('#clinicTable').is(':visible');
        const apiPath = isClinicTable ? '/clinics' : '/doctors';
        const entityType = isClinicTable ? 'clinic' : 'doctor';

        const endpoint = `${apiPath}/${entityId}/availability`;
        const payload = {
            agree: agree,
            disagree: !agree
        };

        // Get the current row data before update
        const row = $(`.btn-agree[onclick*="${entityId}"]`).closest('tr');
        const table = row.closest('table').DataTable();
        const currentData = table.row(row).data();
        
        try {
            const response = await axios.patch(
                `${API_CONFIG.baseUrl}${endpoint}`,
                payload,
                { 
                    headers: {
                        ...API_CONFIG.headers,
                        'Origin': window.location.origin
                    }
                }
            );
            
            if (!response.data) {
                throw new Error('No response data received');
            }

            const updatedData = response.data.updatedData || response.data;
            
            // Update row data based on entity type
            const rowData = table.row(row).data();
            if (isClinicTable) {
                rowData.accepting_patients = updatedData.AcceptingPatients;
                rowData.availability_agree = updatedData.AgreeCount;
                rowData.availability_disagree = updatedData.DisagreeCount;
                rowData.last_updated = updatedData.UpdatedDate;
            } else {
                rowData.accepting_patients = updatedData.accepting_patients ?? updatedData.AcceptingPatients;
                rowData.availability_agree = updatedData.agree ?? updatedData.AgreeCount;
                rowData.availability_disagree = updatedData.disagree ?? updatedData.DisagreeCount;
                rowData.last_updated = updatedData.last_updated ?? updatedData.LastUpdated;
            }
            
            // Redraw the row
            table.row(row).data(rowData).draw(false);
            
        } catch (error) {
            console.error('Error updating availability:', error);
            unavailableEndpoints.add(`${entityType} availability feedback`);
            showApiStatus();

            // Show user-friendly error message
            const errorMessage = error.response?.data?.message || error.message;
            const errorElement = $('<div>')
                .addClass('error-message')
                .text(`Error updating ${entityType} availability: ${errorMessage}`)
                .appendTo('body');
            
            setTimeout(() => errorElement.fadeOut('slow', function() { $(this).remove(); }), 5000);
        }
    } finally {
        hideLoading('feedback');
    }
}; 