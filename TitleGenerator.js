// titleGenerator.js

// Dependencies
// Ensure that projectManager.js and speechRecognition.js are loaded before this script

// Function to Generate Title After 5 Prompts
async function generateTitleFromTranscription(transcript) {
    if (!window.apiKey) {
        // API key is managed by apiKeyManager.js
        // Optionally, you can display a subtle notification here
        return;
    }

    console.log('Generating title based on transcription:', transcript);

    try {
        const trimmedApiKey = window.apiKey.trim();

        // Validate the API key
        if (!isValidAPIKey(trimmedApiKey)) {
            // Optionally, display a subtle error message
            return;
        }

        const payload = {
            messages: [
                { 
                    role: "system", 
                    content: "You are an assistant that generates concise and relevant titles based on provided text. Provide only the title without any additional text." 
                },
                { 
                    role: "user", 
                    content: `Generate a title based on the following transcription:\n\n"${transcript}"` 
                }
            ],
            model: "llama-3.1-8b-instant" // Keep as per user's instruction
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
            console.error(`LLM Error (Title Generation): ${errorData.message || response.statusText}`);
            // Optionally, display a subtle error message
            return;
        }

        const data = await response.json();
        let generatedTitle = data.choices[0].message.content.trim();
        console.log('Generated Title:', generatedTitle);

        // Remove extraneous quotes if present
        if ((generatedTitle.startsWith('"') && generatedTitle.endsWith('"')) || (generatedTitle.startsWith("'") && generatedTitle.endsWith("'"))) {
            generatedTitle = generatedTitle.substring(1, generatedTitle.length - 1);
        }

        // Update the project title
        if (generatedTitle !== '') {
            window.currentProjectTitle.textContent = generatedTitle;
            window.projects[window.currentProjectIndex].name = generatedTitle;
            saveProjects();
            window.titleGenerated = true; // Set flag to prevent further title generation
            // Optionally, display a subtle success notification
        }

    } catch (error) {
        console.error('LLM Error (Title Generation):', error);
        // Optionally, display a subtle error message
    }
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
