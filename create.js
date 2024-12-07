// create.js

// Ensure that apiKeyManager.js is included before this script in your HTML

// Elements
const homeButton = document.getElementById('home-button');
const currentProjectTitle = document.getElementById('current-project-title');
const generateButton = document.getElementById('generate-button');
const openApiKeyButton = document.getElementById('open-api-key-button');
const clearButton = document.getElementById('clear-button');
const undoButton = document.getElementById('undo-button');
const projectsDropdownButton = document.getElementById('projects-dropdown-button');
const projectsDropdownMenu = document.getElementById('projects-dropdown-menu');
const dropdownProjectList = document.getElementById('dropdown-project-list');
const webViewer = document.getElementById('web-viewer');
const transcriptionDisplay = document.getElementById('transcription');
const downloadButton = document.getElementById('download-button');

// State
let projects = JSON.parse(localStorage.getItem('GROQ_PROJECTS')) || [];
let currentProjectIndex = parseInt(localStorage.getItem('GROQ_CURRENT_PROJECT_INDEX'), 10);
let currentProject = projects[currentProjectIndex] || null;
let undoStack = [];
let currentHTML = currentProject
  ? currentProject.html
  : `
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

// Flags
let titleGenerated = false;
let firstTranscription = true;

// Initialize
if (currentProject) {
  currentProjectTitle.textContent = currentProject.name;
  currentProjectTitle.contentEditable = 'false';
  updateWebViewer();
} else {
  // If no current project, redirect to home page
  window.location.href = 'index.html';
}

// Update Web Viewer with Current HTML
function updateWebViewer() {
  webViewer.srcdoc = currentHTML;
  webViewer.onload = () => {
    try {
      webViewer.contentWindow.scrollTo(0, 0);
    } catch (error) {
      console.error('Unable to scroll iframe:', error);
    }
  };
}

// Switch to Home Page
function switchToHomePage() {
  window.location.href = 'index.html';
}

// Save Current Project's HTML to Local Storage
function saveCurrentProject() {
  if (currentProject !== null) {
    currentProject.html = currentHTML;
    projects[currentProjectIndex] = currentProject;
    localStorage.setItem('GROQ_PROJECTS', JSON.stringify(projects));
  }
}

// Load Projects into Drop-down Menu
function loadProjectsIntoDropdown() {
  dropdownProjectList.innerHTML = '';

  if (projects.length === 0) {
    const noProjectItem = document.createElement('li');
    noProjectItem.textContent = 'No projects available.';
    noProjectItem.style.cursor = 'default';
    dropdownProjectList.appendChild(noProjectItem);
  } else {
    projects.forEach((project, index) => {
      const dropdownItem = document.createElement('li');
      dropdownItem.textContent = project.name;
      dropdownItem.addEventListener('click', () => {
        openProject(index);
        toggleDropdown();
      });
      dropdownProjectList.appendChild(dropdownItem);
    });
  }
}

// Open a Project
function openProject(index) {
  currentProjectIndex = index;
  currentProject = projects[index];
  currentProjectTitle.textContent = currentProject.name;
  currentProjectTitle.contentEditable = 'false';
  currentHTML = currentProject.html || currentHTML;
  updateWebViewer();
  undoStack = []; // Reset undo stack
  titleGenerated = false; // Reset title generation flag
  firstTranscription = true; // Allow title generation again if needed
  localStorage.setItem('GROQ_CURRENT_PROJECT_INDEX', index);
}

// Toggle Drop-down Menu
function toggleDropdown() {
  projectsDropdownMenu.classList.toggle('show');
}

// Close the drop-down if clicked outside
window.addEventListener('click', function (event) {
  if (!event.target.matches('#projects-dropdown-button')) {
    if (projectsDropdownMenu.classList.contains('show')) {
      projectsDropdownMenu.classList.remove('show');
    }
  }
});

// Undo Last Change
function undoLastChange() {
  if (undoStack.length === 0) {
    alert('No more changes to undo.');
    return;
  }
  currentHTML = undoStack.pop();
  updateWebViewer();
  saveCurrentProject();
}

// Clear Everything
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

    // Update current project
    if (currentProject !== null) {
      currentProject.html = currentHTML;
      saveCurrentProject();
    }

    alert('All data has been cleared.');
  }
}

// Make Title Editable on Click
currentProjectTitle.addEventListener('click', () => {
  if (!titleGenerated) {
    currentProjectTitle.contentEditable = 'true';
    currentProjectTitle.classList.add('editable');
    currentProjectTitle.focus();
  }
});

// Save Title on Blur or Enter Key
currentProjectTitle.addEventListener('blur', () => {
  saveTitle();
});

currentProjectTitle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    currentProjectTitle.blur();
  }
});

function saveTitle() {
  currentProjectTitle.contentEditable = 'false';
  currentProjectTitle.classList.remove('editable');
  const newTitle = currentProjectTitle.textContent.trim();
  if (newTitle === '') {
    alert('Project title cannot be empty.');
    currentProjectTitle.textContent = currentProject.name;
  } else {
    // Update project name
    projects[currentProjectIndex].name = newTitle;
    saveCurrentProject();
  }
}

// Download Button Event Listener
if (downloadButton) {
  downloadButton.addEventListener('click', () => {
    const blob = new Blob([currentHTML], { type: 'text/html' });
    const link = document.createElement('a');
    // Sanitize the title to create a valid filename
    const sanitizedTitle = currentProjectTitle.textContent
      .trim()
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const filename = `${sanitizedTitle || 'project'}.html`;
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// Event Listeners
homeButton.addEventListener('click', switchToHomePage);
projectsDropdownButton.addEventListener('click', toggleDropdown);

// API Key Event Listeners
openApiKeyButton.addEventListener('click', window.openApiKeyModal);
undoButton.addEventListener('click', undoLastChange);
clearButton.addEventListener('click', clearEverything);

// Load Projects into Drop-down Menu on Page Load
window.addEventListener('load', loadProjectsIntoDropdown);

// Generate Button Event Listeners for Press and Hold
generateButton.addEventListener('mousedown', startPress);
generateButton.addEventListener('touchstart', startPress);

generateButton.addEventListener('mouseup', cancelPress);
generateButton.addEventListener('mouseleave', cancelPress);
generateButton.addEventListener('touchend', cancelPress);
generateButton.addEventListener('touchcancel', cancelPress);

// Keyboard Event Listeners for Spacebar
let spacebarPressed = false;

document.addEventListener('keydown', function (e) {
  if (e.code === 'Space' && !spacebarPressed) {
    const activeElement = document.activeElement;
    const isEditable =
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable);
    if (isEditable) {
      return;
    }

    e.preventDefault();
    spacebarPressed = true;
    startRecognition();
  }
});

document.addEventListener('keyup', function (e) {
  if (e.code === 'Space' && spacebarPressed) {
    e.preventDefault();
    spacebarPressed = false;
    stopRecognition();
  }
});

// Speech Recognition Setup
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognitionInstance;
let isRecognizingFlag = false;
let finalTranscript = '';

if (SpeechRecognition) {
  recognitionInstance = new SpeechRecognition();
  recognitionInstance.lang = 'en-US';
  recognitionInstance.interimResults = true;
  recognitionInstance.maxAlternatives = 1;
  recognitionInstance.continuous = true;

  recognitionInstance.onstart = () => {
    isRecognizingFlag = true;
    showTranscription('Listening...');
    generateButton.classList.add('active');
    finalTranscript = '';
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
    showTranscription(finalTranscript + ' ' + interimTranscript);

    if (firstTranscription && finalTranscript.trim() !== '') {
      firstTranscription = false;
      generateTitleFromTranscription(finalTranscript.trim());
    }
  };

  recognitionInstance.onerror = (event) => {
    console.error('Speech Recognition Error:', event.error);
    hideTranscription();
    generateButton.classList.remove('active');
    alert('Speech Recognition Error: ' + event.error);
  };

  recognitionInstance.onend = () => {
    if (isRecognizingFlag) {
      try {
        recognitionInstance.start();
      } catch (error) {
        console.error('Recognition Restart Error:', error);
      }
    } else {
      hideTranscription();
      generateButton.classList.remove('active');
      if (finalTranscript.trim()) {
        processCommand(finalTranscript.trim());
      }
      finalTranscript = '';
    }
  };
} else {
  alert('Your browser does not support the SpeechRecognition API.');
}

// Start and Stop Recognition Functions
function startPress(e) {
  e.preventDefault();
  startRecognition();
}

function cancelPress(e) {
  stopRecognition();
}

function startRecognition() {
  if (recognitionInstance && !isRecognizingFlag) {
    isRecognizingFlag = true;
    finalTranscript = '';
    firstTranscription = true;
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

// Process Command
async function processCommand(command) {
  if (!window.apiKey) {
    alert('API Key is missing. Please enter your Groq API Key.');
    window.openApiKeyModal();
    return;
  }

  console.log('Transcription:', command);
  await getLLMResponse(command);
}

// Get LLM Response from Groq's Llama Model for Commands
async function getLLMResponse(message) {
  try {
    const trimmedApiKey = window.apiKey.trim();

    if (!isValidAPIKey(trimmedApiKey)) {
      alert(
        'API Key contains invalid characters. Please check your key and try again.'
      );
      window.openApiKeyModal();
      return;
    }

    const payload = {
      messages: [
        {
          role: 'system',
          content:
            'You are a senior software developer that helps modify HTML, CSS, and JavaScript based on user voice commands. Respond only with the updated full HTML code, including all necessary CSS and JS, without any additional explanations. Make sure you stick to a modern and complete looking design, but also experiment with different designs.',
        },
        {
          role: 'user',
          content: `Modify the following HTML code based on this command and also add the FULL message as comments in your code: "${message}"\n\nCurrent HTML Code:\n${currentHTML}`,
        },
      ],
      model: 'mixtral-8x7b-32768',
    };

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${trimmedApiKey}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      alert(`LLM Error: ${errorData.message || response.statusText}`);
      return;
    }

    const data = await response.json();
    let reply = data.choices[0].message.content.trim();
    console.log('LLM Reply:', reply);

    if (
      (reply.startsWith('"') && reply.endsWith('"')) ||
      (reply.startsWith("'") && reply.endsWith("'"))
    ) {
      reply = reply.substring(1, reply.length - 1);
    }

    if (isValidHTML(reply)) {
      applyChange(reply);
    } else {
      alert(
        'Received invalid HTML from the LLM. Please try a different command.'
      );
    }
  } catch (error) {
    console.error('LLM Error:', error);
    alert(`LLM Error: ${error.message}`);
  }
}

// Get LLM Response for Title Generation
async function generateTitleFromTranscription(transcript) {
  if (!window.apiKey) {
    alert('API Key is missing. Please enter your Groq API Key.');
    window.openApiKeyModal();
    return;
  }

  console.log('Generating title based on transcription:', transcript);

  try {
    const trimmedApiKey = window.apiKey.trim();

    if (!isValidAPIKey(trimmedApiKey)) {
      alert(
        'API Key contains invalid characters. Please check your key and try again.'
      );
      window.openApiKeyModal();
      return;
    }

    const payload = {
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant that generates concise and relevant titles based on provided text. Provide only the title without any additional text.',
        },
        {
          role: 'user',
          content: `Generate a title based on the following transcription:\n\n"${transcript}"`,
        },
      ],
      model: 'llama-3.1-8b-instant',
    };

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${trimmedApiKey}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      alert(
        `LLM Error (Title Generation): ${
          errorData.message || response.statusText
        }`
      );
      return;
    }

    const data = await response.json();
    let generatedTitle = data.choices[0].message.content.trim();
    console.log('Generated Title:', generatedTitle);

    if (
      (generatedTitle.startsWith('"') && generatedTitle.endsWith('"')) ||
      (generatedTitle.startsWith("'") && generatedTitle.endsWith("'"))
    ) {
      generatedTitle = generatedTitle.substring(1, generatedTitle.length - 1);
    }

    if (generatedTitle !== '') {
      currentProjectTitle.textContent = generatedTitle;
      projects[currentProjectIndex].name = generatedTitle;
      saveCurrentProject();
      titleGenerated = true;
    }
  } catch (error) {
    console.error('LLM Error (Title Generation):', error);
    alert(`LLM Error (Title Generation): ${error.message}`);
  }
}

// Function to validate API Key
function isValidAPIKey(key) {
  for (let i = 0; i < key.length; i++) {
    const code = key.charCodeAt(i);
    if (code > 255) {
      return false;
    }
  }
  return true;
}

// Function to validate HTML
function isValidHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return !doc.querySelector('parsererror');
}

// Apply Changes to HTML
function applyChange(newHTML) {
  undoStack.push(currentHTML);
  currentHTML = newHTML;
  updateWebViewer();
  saveCurrentProject();
}

// Show Transcription
function showTranscription(text) {
  transcriptionDisplay.textContent = text || 'Transcribing...';
  transcriptionDisplay.style.display = 'block';
}

// Hide Transcription
function hideTranscription() {
  transcriptionDisplay.style.display = 'none';
}
