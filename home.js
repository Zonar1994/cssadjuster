// home.js

// Ensure that apiKeyManager.js is included before this script in your HTML

// Elements
const projectList = document.getElementById('project-list');
const newProjectButton = document.getElementById('new-project-button');

// State
let projects = JSON.parse(localStorage.getItem('GROQ_PROJECTS')) || [];

// Load Projects on Home Page
function loadProjects() {
    // Clear existing list
    projectList.innerHTML = '';

    if (projects.length === 0) {
        const noProjectItem = document.createElement('li');
        noProjectItem.textContent = 'No projects found. Create a new project!';
        noProjectItem.style.cursor = 'default';
        projectList.appendChild(noProjectItem);
    } else {
        projects.forEach((project, index) => {
            const projectItem = document.createElement('li');

            // Project Name
            const nameSpan = document.createElement('span');
            nameSpan.textContent = project.name;
            nameSpan.style.flex = '1';
            nameSpan.style.cursor = 'pointer';
            nameSpan.addEventListener('click', () => openProject(index));

            // Delete Button
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.innerHTML = '🗑️';
            deleteButton.title = 'Delete Project';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the openProject
                deleteProject(index);
            });

            projectItem.appendChild(nameSpan);
            projectItem.appendChild(deleteButton);
            projectList.appendChild(projectItem);
        });
    }
}

// Save Projects to Local Storage
function saveProjects() {
    localStorage.setItem('GROQ_PROJECTS', JSON.stringify(projects));
    loadProjects();
}

// Open a Project (navigate to create.html with project index)
function openProject(index) {
    // Save the project index to localStorage to load it on creation page
    localStorage.setItem('GROQ_CURRENT_PROJECT_INDEX', index);
    window.location.href = 'create.html';
}

// Create a New Project
function createNewProject() {
    const defaultTitle = "New Project";

    const newProject = {
        name: defaultTitle,
        html: `
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
        `
    };

    projects.push(newProject);
    saveProjects();
    openProject(projects.length - 1);
}

// Delete a Project (without confirmation pop-up)
function deleteProject(index) {
    projects.splice(index, 1);
    saveProjects();
    // Optionally, show a notification that the project was deleted
}

// Event Listeners
newProjectButton.addEventListener('click', createNewProject);

// Load Projects on Page Load
window.addEventListener('load', loadProjects);
