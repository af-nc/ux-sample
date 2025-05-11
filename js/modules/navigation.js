export function initializeNavigation(doctorTable, clinicTable) {
    // Tab switching functionality
    $('#doctorTab').on('click', function () {
        $('#doctorTab').addClass('active');
        $('#clinicTab').removeClass('active');
        $('#doctorTable').show();
        $('#clinicTable').hide();
        doctorTable.draw(false);
        const currentSearch = $('#globalSearch').val();
        doctorTable.search(currentSearch).draw();
    });

    $('#clinicTab').on('click', function () {
        $('#clinicTab').addClass('active');
        $('#doctorTab').removeClass('active');
        $('#clinicTable').show();
        $('#doctorTable').hide();
        clinicTable.draw(false);
        const currentSearch = $('#globalSearch').val();
        clinicTable.search(currentSearch).draw();
    });

    // Navigation handling
    $('.nav-item').on('click', function () {
        $('.nav-item').removeClass('active');
        $(this).addClass('active');

        const page = $(this).text();
        $('#mainContent, #aboutContent, #contactContent').hide();

        switch (page) {
            case 'About':
                $('#aboutContent').show();
                break;
            case 'Contact':
                $('#contactContent').show();
                const provideUpdateBtn = document.querySelector('.request-type-btn[data-type="provide_update"]');
                if (provideUpdateBtn) {
                    provideUpdateBtn.click();
                }
                const messageTextarea = document.getElementById('message');
                if (messageTextarea) {
                    messageTextarea.value = '📝 Please provide any additional information that might be relevant...';
                }
                break;
            case 'Doctors':
                $('#mainContent').show();
                break;
        }
    });
}

// Function to show Terms of Service
export function showTermsOfService() {
    $('#mainContent, #aboutContent, #contactContent, #privacyPolicyContent').hide();
    $('#termsOfServiceContent').show();
    $('.nav-item').removeClass('active');
}

// Function to show Privacy Policy
export function showPrivacyPolicy() {
    $('#mainContent, #aboutContent, #contactContent').hide();
    $('#privacyPolicyContent').show();
    $('.nav-item').removeClass('active');
} 