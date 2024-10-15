import { getExtResUrl, dispatchWindowMessage, loadFromExtStorage, sendToRuntime, loadExtStorage, addExtensionMessageActionListener, openOptionsPage } from "../service.js";
import { STATUS, ACTIONS, config as defaultConf } from "../config.js";
import recorder from "../recorder.js";

console.log('Voice Extension Recorder iFrame loaded');

injectStyles();
let config = defaultConf;
const recordButton = document.querySelector('button');
const img = document.querySelector('img');
setStatus(STATUS.stop);

(async () => {
    config = await loadExtStorage();
    
    recordButton.addEventListener('click', async () => {
        if(await checkApiKey()) {
            recorder.toggleRecording();
        }
    });
    
    addExtensionMessageActionListener(ACTIONS.toggleRecording, async () => {
        if(await checkApiKey()) {
            recorder.toggleRecording();
        }
    });

    addEventListener(ACTIONS.startedRecording, () => {
        setStatus(STATUS.start)
        recordButton.ariaPressed = true;
    });

    addEventListener(ACTIONS.stoppedRecording, () => {
        setStatus(STATUS.stop)
        recordButton.ariaPressed = false;
    });

    addEventListener(ACTIONS.audioBlobAvailable, async (blob) => {
        console.log(ACTIONS.audioBlobAvailable, blob.detail)
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
})();

async function checkApiKey() {
    let apiKey = await loadFromExtStorage('apiKey');
    if(!apiKey) {
        openOptionsPageDialog('No API key set!');
        return false;
    }
    return true;
}

function openOptionsPageDialog(message = '') {
    const choice = confirm(message + ' Would you like to open the options page and set your API key?');
    if(choice){
        openOptionsPage();
        location.reload();
    }
}

async function injectStyles() {
    const style = document.createElement('style');
    let btnCss = await loadFromExtStorage('btnCss');

    style.innerHTML = `
        #${config.extBtnId} {
            ${btnCss}
        }
        #${config.extBtnId} > img { 
            width: 16; 
            height: 16;
        }
    `;
    document.head.appendChild(style);
}

function setStatus(status) {
    img.src = getExtResUrl(status.img);
    recordButton.style.background = status.color
    sendToRuntime({ action: ACTIONS.badge, data: status });
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
            console.log(data);

            const url = getExtResUrl('src/recorder/recorder.html');

            if (data.text) {
                console.log('Transcript:', data.text);
                window.parent.postMessage({action: ACTIONS.transcriptReady, text: data.text}, '*');
                copyTextToClipboard(data.text);
            }
        })
        .catch(error => {
            dispatchWindowMessage(ACTIONS.fetching, false)
            console.warn('Error sending audio data to Whisper API:', error);
        })
        .finally(() => {
            dispatchWindowMessage(ACTIONS.resetRecording);
        });
}

function copyTextToClipboard(text) {
    // Create a temporary textarea element and use old execCommand API
    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}
