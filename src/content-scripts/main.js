import { addExtensionMessageActionListener, getExtResUrl, loadFromExtStorage, sendToRuntime, callBackgroundFunction, dispatchWindowMessage, loadExtStorage, focusLastFocusedTab, getExposedBackgroundFunctions } from "../service";
import recorder from "../recorder";
import { STATUS, ACTIONS } from "../config";
import { config as defaultConf } from "../config";

let config = defaultConf;
let promptTextarea;

const recordButton = document.createElement('button');
recordButton.id = config.extBtnId;
recordButton.ariaPressed = false;
recordButton.title = 'Toggle audio (Ctrl+Shift+K)';
const img = document.createElement('img');
recordButton.appendChild(img);
const style = document.createElement('style');

function setStatus(status) {
    img.src = getExtResUrl(status.img);
    recordButton.style.background = status.color
    sendToRuntime({ action: ACTIONS.badge, data: status });
}

(async () => {
    console.log('Content script loaded');

    config = await loadExtStorage();

    createUI();
})();

recordButton.addEventListener('click', () => {
    recorder.toggleRecording();
});

addEventListener(ACTIONS.startedRecording, () => {
    setStatus(STATUS.start)
    recordButton.ariaPressed = true;
});

addEventListener(ACTIONS.stoppedRecording, () => {
    setStatus(STATUS.stop)
    recordButton.ariaPressed = false;
});

addEventListener(ACTIONS.audioReady, (blob) => {
    console.log(ACTIONS.audioReady, blob.detail)
    const formData = new FormData();

    formData.append('file', blob.detail, 'audio.wav');
    config.formFields.forEach(entry => {
        const { key, value } = entry;
        formData.append(key, value);
    });

    console.log('sending audio data to whisper api', formData);

    sendToWhisperAPI(formData);
});

addEventListener(ACTIONS.fetching, (fetching) => {
    console.log(ACTIONS.fetching, fetching.detail)
    if (fetching.detail) {
        setStatus(STATUS.fetching);
    } else {
        setStatus(STATUS.stop);
    }
});

// Listen to keyboard shortcuts
addExtensionMessageActionListener(ACTIONS.toggleRecording, () => {
    recorder.toggleRecording();
});

async function createUI() {
    const showButton = await loadFromExtStorage('showButton');
    let btnCss = await loadFromExtStorage('btnCss');

    setStatus(STATUS.stop)

    const elem = config.injectRecordButton.find(e => window.location.href.includes(e.url));
    promptTextarea = document.querySelector(elem?.selector ?? 'lolidontmatchanythinghopefully');

    if (promptTextarea) {
        btnCss = elem?.css ?? btnCss;
        promptTextarea.insertAdjacentElement('afterend', recordButton);
    } else if (showButton) {
        document.body.appendChild(recordButton);
    }

    // Insert the style tag into the document
    style.innerHTML = '#' + config.extBtnId + '{' + btnCss + '} #' + config.extBtnId + ' > img { width: 16; height = 16;}';
    document.head.appendChild(style);
}

async function insertTextIntoInput(text) {
    // Focus last focused tab
    // await focusLastFocusedTab();

    const focusedElement = document.activeElement;
    if (focusedElement) {
        if (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA') {
            focusedElement.value += ' ' + text;
        }
        if (focusedElement.isContentEditable) {
            focusedElement.textContent += ' ' + text;
        }
    }
    if (promptTextarea) {
        promptTextarea.value += ' ' + text;
    }

    // Copy the text to the clipboard
    copyTextToClipboard(text);

    // Reset recordinf chunks to not send / append same recorded
    dispatchWindowMessage(ACTIONS.resetRecording);
}

// Send the audio data to the Whisper API
async function sendToWhisperAPI(formData) {
    // Make an HTTP request to the transcription API
    const apiKey = await loadFromExtStorage('apiKey');
    const apiUrl = await loadFromExtStorage('apiUrl');

    dispatchWindowMessage(ACTIONS.fetching, true)

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
            dispatchWindowMessage(ACTIONS.fetching, false)

            // Handle the response from the Whisper API
            console.log('Whisper API response:', data);

            // Now you can handle the text data received from the Whisper API
            // For example, you can copy it to the clipboard or insert it into an input field
            if (data.text) {
                insertTextIntoInput(data.text);
            }
        })
        .catch(error => {
            dispatchWindowMessage(ACTIONS.fetching, false)
            console.warn('Error sending audio data to Whisper API:', error);
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
    // Create a temporary textarea element and use old execCommand API
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}