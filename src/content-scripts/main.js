import { addExtensionMessageActionListener, getExtResUrl, loadFromExtStorage, sendToRuntime, callBGFunction, dispatchWindowMessage, loadExtStorage } from "../service";
import recorder from "../recorder";
import { actions, colors, status } from "../config";

sendToRuntime({ action: actions.badge, data: status.stop });

let config, promptTextarea, img;
const recordButton = document.createElement('button');
recordButton.id = 'ext-voice-to-text';
recordButton.ariaPressed = false;
recordButton.title = 'Toggle audio (Ctrl+Shift+K)';

const style = document.createElement('style');

(async () => {
    console.log('Content script loaded');

    config = await loadExtStorage();

    createButton();
})();

recordButton.addEventListener('click', () => {
    recorder.toggleRecording();
});

addEventListener(actions.startedRecording, () => {
    // style button red
    recordButton.style.backgroundColor = colors.red;
    img.src = getExtResUrl('assets/puff.svg'); // audio.svg
    recordButton.ariaPressed = true;
    sendToRuntime({ action: actions.badge, data: status.start });
});

addEventListener(actions.stoppedRecording, () => {
    // style button white
    recordButton.style.backgroundColor = colors.violet;
    img.src = getExtResUrl('assets/micro.svg');
    recordButton.ariaPressed = false;
    sendToRuntime({ action: actions.badge, data: status.stop });
});

addEventListener(actions.audioReady, (blob) => {
    console.log(actions.audioReady, blob.detail)
    const formData = new FormData();

    formData.append('file', blob.detail, 'audio.wav');
    config.formFields.forEach(entry => {
        const { key, value } = entry;
        formData.append(key, value);
    });

    console.log('sending audio data to whisper api', formData);

    sendToWhisperAPI(formData);
});

addEventListener(actions.fetching, (fetching) => {
    console.log(actions.fetching, fetching.detail)
    if (fetching.detail) {
        recordButton.style.backgroundColor = colors.orange;
        img.src = getExtResUrl('assets/oval.svg');
        sendToRuntime({ action: actions.badge, data: status.fetching });
    } else {
        recordButton.style.backgroundColor = colors.violet;
        img.src = getExtResUrl('assets/micro.svg');
        sendToRuntime({ action: actions.badge, data: status.stop });
    }
});

// Listen to keyboard shortcuts
addExtensionMessageActionListener(actions.toggleRecording, () => {
    recorder.toggleRecording();
});

async function createButton() {
    const showButton = await loadFromExtStorage('showButton');
    let btnCss = await loadFromExtStorage('btnCss');

    img = document.createElement('img');
    img.src = getExtResUrl('assets/micro.svg');
    img.alt = 'microphone';
    img.width = 16;
    img.height = 16;
    recordButton.appendChild(img);

    const elem = config.injectRecordButtonMatching.find(e => window.location.href.includes(e.url));
    promptTextarea = document.querySelector(elem?.selector ?? 'lolidontmatchanythinghopefully');

    console.log(showButton, btnCss, promptTextarea)

    if (showButton) {
        if (promptTextarea) {
            console.log('promptTextarea found');
            const classes = "p-1 rounded-md md:bottom-3 gizmo:md:bottom-2.5 md:p-2 md:right-3 enabled:bg-brand-purple gizmo:enabled:bg-transparent text-white gizmo:text-gray-500 gizmo:dark:text-gray-300 bottom-1.5 transition-colors"
                .split(' ');
            btnCss = "position: absolute; right: 50px; z-index: 9999; width: 32px; height: 32px; font-size: 10px; line-height: 1; text-align: center; cursor: pointer;";
            recordButton.classList.add(...classes);

            console.log(promptTextarea)
            promptTextarea.insertAdjacentElement('afterend', recordButton);
        } else {
            console.log('no promptTextarea found');
            document.body.appendChild(recordButton);
        }
    }

    // Insert the style tag into the document
    style.innerHTML = '#ext-voice-to-text {' + btnCss + '}';
    document.head.appendChild(style);
}

function insertTextIntoInput(text) {
    const focusedElement = document.activeElement;
    if (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA') {
        focusedElement.value += ' ' + text;
    }
    if (focusedElement.isContentEditable) {
        focusedElement.textContent += ' ' + text;
    }
    if (promptTextarea) {
        promptTextarea.value += ' ' + text;
    }

    // Copy the text to the clipboard
    copyTextToClipboard(text);

    dispatchWindowMessage(actions.resetRecording);
}

// Send the audio data to the Whisper API
async function sendToWhisperAPI(formData) {
    // Make an HTTP request to the transcription API
    const apiKey = await loadFromExtStorage('apiKey');
    const apiUrl = await loadFromExtStorage('apiUrl');

    dispatchWindowMessage(actions.fetching, true)

    const options = {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        method: 'POST',
        body: formData,
    };

    console.log('Sending audio data to Whisper API:', options);

    fetch(apiUrl, options)
        .then(response => response.json())
        .then(data => {
            dispatchWindowMessage(actions.fetching, false)

            // Handle the response from the Whisper API
            console.log('Whisper API response:', data);

            // Now you can handle the text data received from the Whisper API
            // For example, you can copy it to the clipboard or insert it into an input field
            if (data.text) {
                insertTextIntoInput(data.text);
            }
        })
        .catch(error => {
            dispatchWindowMessage(actions.fetching, false)

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