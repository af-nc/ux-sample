// Function to show validation error
function showValidationError(element, message) {
    const existingError = element.parentElement.querySelector('.validation-error');
    if (existingError) {
        existingError.remove();
    }

    element.classList.add('error');

    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.textContent = message;
    element.parentElement.appendChild(errorDiv);
}

// Function to clear validation error
function clearValidationError(element) {
    const errorDiv = element.parentElement.querySelector('.validation-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    element.classList.remove('error');
}

export function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    const requestTypeButtons = document.querySelectorAll('.request-type-btn');
    const provideUpdateFields = document.getElementById('provideUpdateFields');
    const messageField = document.querySelector('.message-group');
    const sourceSelect = document.getElementById('source');
    const otherSourceField = document.getElementById('otherSourceField');
    const statusButtons = document.querySelectorAll('.status-btn');

    // Handle request type button selection
    requestTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            requestTypeButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            document.getElementById('requestType').value = button.dataset.type;

            if (button.dataset.type === 'provide_update') {
                provideUpdateFields.style.display = 'block';
                messageField.querySelector('textarea').required = true;
                messageField.querySelector('label').innerHTML = 'Additional Details <span class="required">*</span>';
                document.getElementById('doctorClinicName').required = true;
                document.getElementById('currentStatus').required = true;
                document.getElementById('source').required = true;
            } else {
                provideUpdateFields.style.display = 'none';
                messageField.querySelector('textarea').required = true;
                messageField.querySelector('label').innerHTML = 'Additional Details <span class="required">*</span>';
                document.getElementById('doctorClinicName').required = false;
                document.getElementById('currentStatus').required = false;
                document.getElementById('source').required = false;
            }
        });
    });

    // Handle status button selection
    statusButtons.forEach(button => {
        button.addEventListener('click', () => {
            statusButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            document.getElementById('currentStatus').value = button.dataset.status;
            clearValidationError(document.getElementById('currentStatus'));
        });
    });

    // Handle source selection
    sourceSelect.addEventListener('change', () => {
        if (sourceSelect.value === 'other') {
            otherSourceField.style.display = 'block';
            otherSourceField.querySelector('input').required = true;
        } else {
            otherSourceField.style.display = 'none';
            otherSourceField.querySelector('input').required = false;
            clearValidationError(otherSourceField.querySelector('input'));
        }
    });

    // Form validation and submission
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        e.stopPropagation();

        const honeypot = document.getElementById('honeypot').value;
        if (honeypot) {
            console.log('Spam detected. Submission rejected.');
            return;
        }

        document.querySelectorAll('.validation-error').forEach(error => error.remove());
        document.querySelectorAll('.error').forEach(element => element.classList.remove('error'));

        const requestType = document.getElementById('requestType').value;
        let hasErrors = false;

        if (!requestType) {
            showValidationError(requestTypeButtons[0], 'Please select what you would like to do');
            hasErrors = true;
        }

        if (requestType === 'provide_update') {
            const doctorClinicName = document.getElementById('doctorClinicName');
            const currentStatus = document.getElementById('currentStatus');
            const source = document.getElementById('source');
            const otherSource = document.getElementById('otherSource');
            const message = document.getElementById('message');

            if (!doctorClinicName.value.trim()) {
                showValidationError(doctorClinicName, 'Please enter the doctor or clinic name');
                hasErrors = true;
            }

            if (!currentStatus.value) {
                showValidationError(currentStatus, 'Please select the current status');
                hasErrors = true;
            }

            if (!source.value) {
                showValidationError(source, 'Please select a source of information');
                hasErrors = true;
            }

            if (source.value === 'other' && !otherSource.value.trim()) {
                showValidationError(otherSource, 'Please specify your source of information');
                hasErrors = true;
            }

            if (!message.value.trim() || message.value === '📝 Please provide any additional information that might be relevant...') {
                showValidationError(message, 'Please provide additional details about the doctor or clinic');
                hasErrors = true;
            }
        } else if (requestType) {
            const message = document.getElementById('message');
            if (!message.value.trim() || message.value === '📝 Please provide any additional information that might be relevant...') {
                showValidationError(message, 'Please provide your message');
                hasErrors = true;
            }
        }

        if (hasErrors) {
            return false;
        }

        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        try {
            const formData = new FormData(this);
            const response = await fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                alert('Thank you for your feedback! We\'ll review it shortly.');
                this.reset();
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Sorry, there was an error sending your feedback. Please try again later.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Send Message';
        }
    });
} 