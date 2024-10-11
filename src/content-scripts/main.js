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

addEventListener(ACTIONS.audioReady, async (blob) => {
    console.log(ACTIONS.audioReady, blob.detail)
    console.log('sending audio data to whisper api');
    sendToWhisperAPI(blob);
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
    const injectRecordButtonUrls = await loadFromExtStorage('injectRecordButtonUrls');
    let btnCss = await loadFromExtStorage('btnCss');

    setStatus(STATUS.stop)

    const matchedUrl = injectRecordButtonUrls?.split(',').some(url => window.location.href.includes(url));
    console.log(matchedUrl, showButton, injectRecordButtonUrls, btnCss)

    if (showButton || matchedUrl) {
        document.body.appendChild(recordButton);

        // Insert the style tag into the document
        style.innerHTML = '#' + config.extBtnId + '{' + btnCss + '} #' + config.extBtnId + ' > img { width: 16; height = 16;}';
        document.head.appendChild(style);
    }
}

async function sendToWhisperAPI(blob) {
    const apiKey = await loadFromExtStorage('apiKey');
    const apiUrl = await loadFromExtStorage('apiUrl');

    const formFields = await loadFromExtStorage('formFields');
    const formData = new FormData();
    formData.append('file', blob.detail, 'audio.wav');
    formFields.forEach(entry => {
        const { key, value } = entry;
        formData.append(key, value);
    });

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
        .then(async(data) => {
            dispatchWindowMessage(ACTIONS.fetching, false)

            if (data.text) {
                insertTextIntoInput(data.text);
            }
        })
        .catch(error => {
            dispatchWindowMessage(ACTIONS.fetching, false)
            console.warn('Error sending audio data to Whisper API:', error);
        });
}


async function insertTextIntoInput(text) {
    // Focus last focused tab
    // await focusLastFocusedTab();
    let insertIntoInput = await loadFromExtStorage('insertIntoInput');
    let insertIntoInputIds = await loadFromExtStorage('insertIntoInputIds') ?? '#ihopefillydontexistlol';

    const insert = (element, text) => {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            const hasText = element.value.trim() !== '';
            element.value += (hasText ? ' ' : '') + text;
        }
        if (element.isContentEditable) {
            const hasText = element.textContent.trim() !== '';
            element.textContent += (hasText ? ' ' : '') + text;
        }
    }
    
    console.log('insertIntoInput', insertIntoInput)
    const focusedElement = document.activeElement;
    if (focusedElement && insertIntoInput) {
        insert(focusedElement, text);
    }

    const inputsByIds = document.querySelectorAll(insertIntoInputIds);
    for (const input of inputsByIds) {
        insert(input, text);
    }

    copyTextToClipboard(text);

    // Reset recording chunks to not send / append same recorded
    dispatchWindowMessage(ACTIONS.resetRecording);
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
