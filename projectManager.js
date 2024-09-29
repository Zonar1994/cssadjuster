// projectManager.js

// Elements
const projectsDropdownButton = document.getElementById('projects-dropdown-button');
const projectsDropdownMenu = document.getElementById('projects-dropdown-menu');
const dropdownProjectList = document.getElementById('dropdown-project-list');
const currentProjectTitle = document.getElementById('current-project-title');

// State (Declared as global variables)
window.projects = JSON.parse(localStorage.getItem('GROQ_PROJECTS')) || [];
window.currentProjectIndex = parseInt(localStorage.getItem('GROQ_CURRENT_PROJECT_INDEX'), 10);
window.currentProject = window.projects[window.currentProjectIndex] || null;
window.undoStack = [];
window.currentHTML = `
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
window.titleGenerated = false;
window.promptCount = 0;
const maxPromptsBeforeTitle = 5;

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

// Save Projects to Local Storage
function saveProjects() {
    localStorage.setItem('GROQ_PROJECTS', JSON.stringify(projects));
    loadProjectsIntoDropdown();
}

// Open a Project
function openProject(index) {
    window.currentProjectIndex = index;
    window.currentProject = projects[index];
    currentProjectTitle.textContent = window.currentProject.name;
    currentProjectTitle.contentEditable = 'false';
    window.currentHTML = window.currentProject.html || window.currentHTML;
    updateWebViewer();
    window.undoStack = []; // Reset undo stack
    window.titleGenerated = false; // Reset title generation flag
    window.promptCount = 0; // Reset prompt count
    localStorage.setItem('GROQ_CURRENT_PROJECT_INDEX', index);
}

// Create a New Project
function createNewProject() {
    const projectName = prompt('Enter Project Name:');
    if (projectName && projectName.trim() !== '') {
        const newProject = {
            name: projectName.trim(),
            html: window.currentHTML
        };
        projects.push(newProject);
        saveProjects();
        openProject(projects.length - 1);
        showNotification(`Project "${newProject.name}" created successfully!`);
    } else {
        showNotification('Project name cannot be empty.', 'error');
    }
}

// Delete a Project
function deleteProject(index) {
    // Optional: Implement an inline delete button next to each project in the dropdown
    // For simplicity, assuming a separate delete function is called with the project index
    projects.splice(index, 1);
    saveProjects();
    if (projects.length > 0) {
        openProject(0);
    } else {
        window.currentProject = null;
        currentProjectTitle.textContent = 'No Project Selected';
        updateWebViewer();
        showNotification('All projects have been deleted.', 'info');
    }
}

// Toggle Drop-down Menu
function toggleDropdown() {
    projectsDropdownMenu.classList.toggle('show');
}

// Close the drop-down if clicked outside
window.addEventListener('click', function(event) {
    if (!event.target.matches('#projects-dropdown-button')) {
        if (projectsDropdownMenu.classList.contains('show')) {
            projectsDropdownMenu.classList.remove('show');
        }
    }
});

// Update Web Viewer with Current HTML
function updateWebViewer() {
    const webViewer = document.getElementById('web-viewer');
    webViewer.srcdoc = window.currentHTML;
    // Scroll the iframe to the top after content is loaded
    webViewer.onload = () => {
        try {
            webViewer.contentWindow.scrollTo(0, 0);
        } catch (error) {
            console.error('Unable to scroll iframe:', error);
        }
    };
}

// Show Notification (Handled by animations.js)
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `success ${type}`;
    notification.style.display = 'block';
    notification.classList.add('fade-in');

    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('fade-in');
        notification.classList.add('fade-out');
        notification.addEventListener('animationend', () => {
            notification.style.display = 'none';
            notification.className = 'success';
        }, { once: true });
    }, 3000);
}

// Initialize Projects on Page Load
window.addEventListener('load', () => {
    loadProjectsIntoDropdown();
    if (window.currentProject !== null) {
        currentProjectTitle.textContent = window.currentProject.name;
        window.currentHTML = window.currentProject.html || window.currentHTML;
        updateWebViewer();
    } else {
        // Optionally, prompt to create a new project if none exist
        if (projects.length === 0) {
            createNewProject();
        }
    }
});
