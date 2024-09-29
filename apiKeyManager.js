// apiKeyManager.js

// Elements
const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyForm = document.getElementById('api-key-form');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeyStatus = document.getElementById('api-key-status'); // For animation/status
const appContainer = document.getElementById('app');

// State
window.apiKey = localStorage.getItem('GROQ_API_KEY') || '';

// Initialize API Key Modal
function initializeApiKey() {
    if (!window.apiKey) {
        openApiKeyModal();
    }
}

// Open API Key Modal
function openApiKeyModal() {
    apiKeyModal.style.display = 'flex';
    appContainer.classList.add('blurred');
}

// Close API Key Modal
function closeApiKeyModal() {
    apiKeyModal.style.display = 'none';
    appContainer.classList.remove('blurred');
}

// Expose openApiKeyModal function globally if needed
window.openApiKeyModal = openApiKeyModal;

// Handle API Key Form Submission
apiKeyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    let key = apiKeyInput.value.trim();

    // Remove any non-ISO-8859-1 characters
    key = key.replace(/[^\x00-\xFF]/g, '');

    if (key) {
        window.apiKey = key;
        localStorage.setItem('GROQ_API_KEY', window.apiKey);
        closeApiKeyModal();
        // Optionally, show a notification here
    } else {
        // Display an error animation or message without alert
        apiKeyStatus.textContent = 'Invalid API Key.';
        apiKeyStatus.classList.add('error');
        setTimeout(() => {
            apiKeyStatus.textContent = '';
            apiKeyStatus.classList.remove('error');
        }, 2000);
    }
});

// Initialize on Page Load
window.addEventListener('load', initializeApiKey);
