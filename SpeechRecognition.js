// speechRecognition.js

// Elements
const generateButton = document.getElementById('generate-button');
const transcriptionDisplay = document.getElementById('transcription');

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognitionInstance;
let isRecognizingFlag = false;
let finalTranscript = '';

// Initialize Speech Recognition
if (SpeechRecognition) {
    recognitionInstance = new SpeechRecognition();
    recognitionInstance.lang = 'en-US';
    recognitionInstance.interimResults = true;
    recognitionInstance.maxAlternatives = 1;
    recognitionInstance.continuous = true; // Keep recognition active

    recognitionInstance.onstart = () => {
        isRecognizingFlag = true;
        showTranscription('Listening...');
        generateButton.classList.add('active');
        finalTranscript = ''; // Reset transcript when recognition starts
    };

    recognitionInstance.onresult = (event) => {
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

        // Handle Title Generation After 5 Prompts
        if (window.promptCount < maxPromptsBeforeTitle && finalTranscript.trim() !== '') {
            window.promptCount++;
            if (window.promptCount === maxPromptsBeforeTitle) {
                generateTitleFromTranscription(finalTranscript.trim());
            } else {
                processCommand(finalTranscript.trim());
            }
        } else {
            processCommand(finalTranscript.trim());
        }
    };

    recognitionInstance.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        hideTranscription();
        generateButton.classList.remove('active');
        // Optionally, display an inline error message
    };

    recognitionInstance.onend = () => {
        if (isRecognizingFlag) {
            try {
                recognitionInstance.start(); // Restart recognition if still recognizing
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
function startPress(e) {
    e.preventDefault(); // Prevent default behavior like text selection or touch gestures
    startRecognition();
}

function cancelPress(e) {
    stopRecognition();
}

function startRecognition() {
    if (recognitionInstance && !isRecognizingFlag) {
        isRecognizingFlag = true;
        finalTranscript = ''; // Reset transcript when starting
        try {
            recognitionInstance.start();
            showTranscription('Listening...');
            generateButton.classList.add('active');
        } catch (error) {
            console.error('Recognition Start Error:', error);
        }
    }
}

function stopRecognition() {
    if (recognitionInstance && isRecognizingFlag) {
        isRecognizingFlag = false;
        recognitionInstance.stop();
    }
}

// Generate Button Event Listeners for Press and Hold
// Handle both mouse and touch events
generateButton.addEventListener('mousedown', startPress);
generateButton.addEventListener('touchstart', startPress);

generateButton.addEventListener('mouseup', cancelPress);
generateButton.addEventListener('mouseleave', cancelPress);
generateButton.addEventListener('touchend', cancelPress);
generateButton.addEventListener('touchcancel', cancelPress);

// Keyboard Event Listeners for Spacebar
let spacebarPressed = false; // To track the state of spacebar

document.addEventListener('keydown', function(e) {
    // Check if the pressed key is Space and not already pressed
    if (e.code === 'Space' && !spacebarPressed) {
        // Check if the focus is not on an input, textarea, or contenteditable element
        const activeElement = document.activeElement;
        const isEditable = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);
        if (isEditable) {
            return; // Do not toggle transcription if typing in an input field
        }

        e.preventDefault(); // Prevent default spacebar behavior (like scrolling)
        spacebarPressed = true;
        startRecognition();
    }
});

document.addEventListener('keyup', function(e) {
    // Check if the released key is Space
    if (e.code === 'Space' && spacebarPressed) {
        e.preventDefault();
        spacebarPressed = false;
        stopRecognition();
    }
});

// Helper Functions
function showTranscription(text) {
    transcriptionDisplay.textContent = text || 'Transcribing...';
    transcriptionDisplay.style.display = 'block';
}

function hideTranscription() {
    transcriptionDisplay.style.display = 'none';
}
