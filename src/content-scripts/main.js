import { addExtensionMessageActionListener, loadFromExtStorage, sendToRuntime } from "../service";
import recorder from "../recorder";

console.log('content script loaded');

// Create a button to start/stop recording
const recordButton = document.createElement('button');
recordButton.id = 'record';
recordButton.innerHTML = 'Start';

// Style button so that it floats at the bottom right corner of the page
recordButton.style.position = 'fixed';
recordButton.style.bottom = '20px';
recordButton.style.right = '20px';
recordButton.style.zIndex = '9999';
recordButton.style.backgroundColor = '#fff';

// Add the button to the page
document.body.appendChild(recordButton);

sendToRuntime({ action: 'badge', data: 'stop' });

addEventListener('startedRecording', () => {
    recordButton.innerHTML = 'Stop';
    // style button red
    recordButton.style.backgroundColor = '#f00';
    sendToRuntime({ action: 'badge', data: 'start' });
});

addEventListener('stoppedRecording', () => {
    recordButton.innerHTML = 'Start';
    // style button white
    recordButton.style.backgroundColor = '#fff';
    sendToRuntime({ action: 'badge', data: 'stop' });
});

recordButton.addEventListener('click', () => {
    recorder.toggleRecording();
});
// Listen to keyboard shortcuts
addExtensionMessageActionListener('toggleRecording', () => {
    recorder.toggleRecording();
});

// Listen to the 'audioBlobAvailable' event of the recorder
addEventListener('audioBlobAvailable', (blob) => {
    console.log('audioBlobAvailable', blob.detail)
    const formData = new FormData();
    formData.append('file', blob.detail, 'audio.wav');
    formData.append('model', 'whisper-1');
    console.log('sending audio data to whisper api', formData);

    sendToWhisperAPI(formData);
});

function insertTextIntoInput(text) {
    const focusedElement = document.activeElement;
    if (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA') {
        focusedElement.value = text;
    }
    if (focusedElement.isContentEditable) {
        focusedElement.textContent = text;
    }

    // Copy the text to the clipboard
    copyTextToClipboard(text);
}

// Send the audio data to the Whisper API
async function sendToWhisperAPI(formData) {
    // Make an HTTP request to the Whisper API
    // Replace 'YOUR_WHISPER_API_ENDPOINT' with the actual API endpoint
    const whisperApiEndpoint = 'https://api.openai.com/v1/audio/transcriptions';
    const whisperApiKey = await loadFromExtStorage('whisperApiKey');
    const options = {
        headers: {
            'Authorization': `Bearer ${whisperApiKey}`,
        },
        method: 'POST',
        body: formData,
    };

    console.log('Sending audio data to Whisper API:', options);

    fetch(whisperApiEndpoint, options)
        .then(response => response.json())
        .then(data => {
            // Handle the response from the Whisper API
            console.log('Whisper API response:', data);

            // Now you can handle the text data received from the Whisper API
            // For example, you can copy it to the clipboard or insert it into an input field
            if (data.text) {
                insertTextIntoInput(data.text);
            }
        })
        .catch(error => {
            console.error('Error sending audio data to Whisper API:', error);
        });
}

function copyTextToClipboard(text) {

    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }

    // Use the Clipboard API to write the text to the clipboard
    navigator.clipboard.writeText(text)
        .then(() => {
            console.log('Text copied to clipboard:', text);
        })
        .catch(error => {
            console.error('Error copying text to clipboard:', error);
        });


}

function fallbackCopyTextToClipboard(text) {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');

    // Set the value of the textarea to the text to be copied
    textarea.value = text;

    // Append the textarea to the document
    document.body.appendChild(textarea);

    // Select the text in the textarea
    textarea.select();

    // Execute the browser's copy command
    document.execCommand('copy');

    // Remove the textarea from the document
    document.body.removeChild(textarea);
}