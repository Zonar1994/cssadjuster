// Elements
const generateButton = document.getElementById('generate-button');
const openApiKeyButton = document.getElementById('open-api-key-button');
const clearButton = document.getElementById('clear-button');
const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyForm = document.getElementById('api-key-form');
const apiKeyInput = document.getElementById('api-key-input');
const undoButton = document.getElementById('undo-button');
const webViewer = document.getElementById('web-viewer');
const transcriptionDisplay = document.getElementById('transcription');
const appContainer = document.getElementById('app');

// State
let apiKey = localStorage.getItem('GROQ_API_KEY') || '';
let undoStack = [];
let currentHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Live Preview</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background-color: #ffffff;
      color: #000000;
    }
    h1 {
      color: #4CAF50;
    }
  </style>
</head>
<body>
  <h1>Welcome!</h1>
  <p>Use voice commands to modify this page's style.</p>
</body>
</html>
`;
updateWebViewer();

// Initialize
if (!apiKey) {
    openApiKeyModal();
}

// Event Listeners
apiKeyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    let key = apiKeyInput.value.trim();

    // Remove any non-ISO-8859-1 characters
    key = key.replace(/[^\x00-\xFF]/g, '');

    if (key) {
        apiKey = key;
        localStorage.setItem('GROQ_API_KEY', apiKey);
        closeApiKeyModal();
        alert('API Key saved successfully.');
    } else {
        alert('Invalid API Key. Please enter a valid key.');
    }
});

openApiKeyButton.addEventListener('click', openApiKeyModal);
undoButton.addEventListener('click', undoLastChange);
clearButton.addEventListener('click', clearEverything);

// Generate Button Event Listeners for Press and Hold
// Handle both mouse and touch events
generateButton.addEventListener('mousedown', startPress);
generateButton.addEventListener('touchstart', startPress);

generateButton.addEventListener('mouseup', cancelPress);
generateButton.addEventListener('mouseleave', cancelPress);
generateButton.addEventListener('touchend', cancelPress);
generateButton.addEventListener('touchcancel', cancelPress);

function startPress(e) {
    e.preventDefault(); // Prevent default behavior like text selection or touch gestures
    startRecognition();
}

function cancelPress(e) {
    stopRecognition();
}

// Functions

function openApiKeyModal() {
    apiKeyModal.style.display = 'flex';
    appContainer.classList.add('blurred');
}

function closeApiKeyModal() {
    apiKeyModal.style.display = 'none';
    appContainer.classList.remove('blurred');
}

function showTranscription(text) {
    transcriptionDisplay.textContent = text || 'Transcribing...';
    transcriptionDisplay.style.display = 'block';
}

function hideTranscription() {
    transcriptionDisplay.style.display = 'none';
}

function updateWebViewer() {
    webViewer.srcdoc = currentHTML;
    // Scroll the iframe to the top after content is loaded
    webViewer.onload = () => {
        try {
            webViewer.contentWindow.scrollTo(0, 0);
        } catch (error) {
            console.error('Unable to scroll iframe:', error);
        }
    };
}

function undoLastChange() {
    if (undoStack.length === 0) {
        alert('No more changes to undo.');
        return;
    }
    currentHTML = undoStack.pop();
    updateWebViewer();
}

// Clear Everything Functionality
function clearEverything() {
    if (confirm('Are you sure you want to clear everything and restart?')) {
        // Clear the undo stack
        undoStack = [];

        // Reset currentHTML to initial state
        currentHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Live Preview</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background-color: #ffffff;
      color: #000000;
    }
    h1 {
      color: #4CAF50;
    }
  </style>
</head>
<body>
  
</body>
</html>
        `;

        // Update the web viewer
        updateWebViewer();

        // Optionally, clear localStorage if you want to remove the API key as well
        // localStorage.removeItem('GROQ_API_KEY');

        // Removed the second alert
    }
}

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isRecognizing = false;
let finalTranscript = '';

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true; // Keep recognition active

    recognition.onstart = () => {
        isRecognizing = true;
        showTranscription('Listening...');
        generateButton.classList.add('active');
        finalTranscript = ''; // Reset transcript when recognition starts
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        // Show the current transcript without accumulating old transcripts
        showTranscription(finalTranscript + ' ' + interimTranscript);
    };

    recognition.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        hideTranscription();
        generateButton.classList.remove('active');
        alert('Speech Recognition Error: ' + event.error);
    };

    recognition.onend = () => {
        if (isRecognizing) {
            try {
                recognition.start(); // Restart recognition if still recognizing
            } catch (error) {
                console.error('Recognition Restart Error:', error);
            }
        } else {
            hideTranscription();
            generateButton.classList.remove('active');
            if (finalTranscript.trim()) {
                processCommand(finalTranscript.trim());
            }
            finalTranscript = ''; // Clear transcript after processing
        }
    };
} else {
    alert('Your browser does not support the SpeechRecognition API.');
}

// Start and Stop Recognition Functions
function startRecognition() {
    if (recognition && !isRecognizing) {
        isRecognizing = true;
        finalTranscript = ''; // Reset transcript when starting
        try {
            recognition.start();
            showTranscription('Listening...');
            generateButton.classList.add('active');
        } catch (error) {
            console.error('Recognition Start Error:', error);
        }
    }
}

function stopRecognition() {
    if (recognition && isRecognizing) {
        isRecognizing = false;
        recognition.stop();
    }
}

// Process Command
async function processCommand(command) {
    if (!apiKey) {
        alert('API Key is missing. Please enter your Groq API Key.');
        openApiKeyModal();
        return;
    }

    console.log('Transcription:', command);
    await getLLMResponse(command);
}

// Function to validate API Key
function isValidAPIKey(key) {
    // Check if all characters are within ISO-8859-1 range (0-255)
    for (let i = 0; i < key.length; i++) {
        const code = key.charCodeAt(i);
        if (code > 255) {
            return false;
        }
    }
    return true;
}

// Get LLM Response from Groq's Llama Model
async function getLLMResponse(message) {
    try {
        // Trim the API key
        const trimmedApiKey = apiKey.trim();

        // Validate the API key
        if (!isValidAPIKey(trimmedApiKey)) {
            alert('API Key contains invalid characters. Please check your key and try again.');
            openApiKeyModal();
            return;
        }

        const payload = {
            messages: [
                { 
                    role: "system", 
                    content: "You are an assistant that helps modify HTML, CSS, and JavaScript based on user voice commands. Respond only with the updated full HTML code, including all necessary CSS and JS, without any additional explanations.Make sure you stick to a modern and complete looking design, but also experiment with different designs." 
                },
                { 
                    role: "user", 
                    content: `Modify the following HTML code based on this command: "${message}"\n\nCurrent HTML Code:\n${currentHTML}` 
                }
            ],
            model: "llama3-groq-70b-8192-tool-use-preview" // Ensure this model supports the required tasks
        };

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${trimmedApiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(`LLM Error: ${errorData.message || response.statusText}`);
            return;
        }

        const data = await response.json();
        const reply = data.choices[0].message.content.trim();
        console.log('LLM Reply:', reply);

        // Validate and Apply the LLM's Response
        if (isValidHTML(reply)) {
            applyChange(reply);
        } else {
            alert('Received invalid HTML from the LLM. Please try a different command.');
        }

    } catch (error) {
        console.error('LLM Error:', error);
        alert(`LLM Error: ${error.message}`);
    }
}

// Simple HTML Validation
function isValidHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return !doc.querySelector('parsererror');
}

// Apply Changes to HTML
function applyChange(newHTML) {
    // Save current HTML to undo stack
    undoStack.push(currentHTML);

    // Update current HTML
    currentHTML = newHTML;

    // Update Web Viewer
    updateWebViewer();
}
