// download.js

// Elements
const downloadButton = document.getElementById('download-button');

// Function to Download Current HTML
function downloadProject() {
    if (!currentProject) {
        alert('No project selected to download.');
        return;
    }

    const blob = new Blob([currentHTML], { type: 'text/html' });
    const link = document.createElement('a');
    // Sanitize the title to create a valid filename
    const sanitizedTitle = currentProjectTitle.textContent.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${sanitizedTitle || 'project'}.html`; // Default to 'project.html' if title is empty
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Attach Event Listener to Download Button
if (downloadButton) { // Ensure the download button exists
    downloadButton.addEventListener('click', downloadProject);
}
