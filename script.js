// Elements
const generateButton = document.getElementById('generate-button'); // Reference to the generate button
const openApiKeyButton = document.getElementById('open-api-key-button');
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

// Generate Button Event Listeners for Press and Hold
generateButton.addEventListener('mousedown', () => { // Press and hold start
    if (recognition && !isRecognizing) {
        startRecognition();
    }
});
generateButton.addEventListener('mouseup', () => { // Press and hold end
    if (isRecognizing) {
        stopRecognition();
    }
});
generateButton.addEventListener('mouseleave', () => { // Handle if mouse leaves the button while holding
    if (isRecognizing) {
        stopRecognition();
    }
});

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
}

function undoLastChange() {
    if (undoStack.length === 0) {
        alert('No more changes to undo.');
        return;
    }
    currentHTML = undoStack.pop();
    updateWebViewer();
}

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isRecognizing = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isRecognizing = true;
        showTranscription('Listening...');
        generateButton.classList.add('active'); // Add active class for glowing border
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        if (finalTranscript) {
            hideTranscription();
            processCommand(finalTranscript.trim());
        } else {
            showTranscription(interimTranscript.trim());
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        hideTranscription();
        generateButton.classList.remove('active'); // Remove active class
        alert('Speech Recognition Error: ' + event.error);
    };

    recognition.onend = () => {
        isRecognizing = false;
        hideTranscription();
        generateButton.classList.remove('active'); // Remove active class
    };
} else {
    alert('Your browser does not support the SpeechRecognition API.');
}

// Spacebar and Volume Up Button Event Handling
let spacePressed = false;
let volumeUpPressed = false;

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && !spacePressed) {
        event.preventDefault();
        spacePressed = true;
        startRecognition();
    } else if (event.key === 'VolumeUp' && !volumeUpPressed) {
        // Mobile device volume up button detected
        volumeUpPressed = true;
        startRecognition();
    }
});

document.addEventListener('keyup', function(event) {
    if (event.code === 'Space' && spacePressed) {
        event.preventDefault();
        spacePressed = false;
        stopRecognition();
    } else if (event.key === 'VolumeUp' && volumeUpPressed) {
        volumeUpPressed = false;
        stopRecognition();
    }
});

function startRecognition() {
    if (recognition && !isRecognizing) {
        try {
            recognition.start();
        } catch (error) {
            console.error('Recognition Start Error:', error);
        }
    }
}

function stopRecognition() {
    if (recognition && isRecognizing) {
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
                    content: "You are an assistant that helps modify HTML, CSS, and JavaScript based on user voice commands. Respond only with the updated full HTML code, including all necessary CSS and JS, without any additional explanations." 
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
