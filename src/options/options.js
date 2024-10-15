import { saveObjectToExtStorage, loadExtStorage, loadFromExtStorage, saveToExtStorage } from "../service.js";
import { checkMediaAccess, requestClipboardAccess, requestMediaAccess } from "../permissions.js";

let config;
const inputs = document.querySelectorAll('input');
const textareas = document.querySelectorAll('textarea');

function inIframe() {
    try {
        return window.self !== window.top ||
            window.window !== window.parent ||
            window.frameElement;
    } catch (e) {
        return true;
    }
}

function get(path = '', nestedObject = {}) {
    let data = nestedObject;
    for (const segment of path.split('.')) {
        try {
            data = data[segment];
        }
        catch (e) {
            console.warn('Attribute not found', e)
            return undefined;
        }
    }
    return data;
}

// sets the attribute inside a nested object by path
function set(path = '', nestedObj = {}, value) {
    var schema = nestedObj;
    var segments = path.split('.');
    var len = segments.length;
    for (var i = 0; i < len - 1; i++) {
        var elem = segments[i];
        if (!schema[elem]) schema[elem] = {}
        schema = schema[elem];
    }
    schema[segments[len - 1]] = value;
}

function save() {
    for (const elem of inputs) {

        if (elem.type === 'checkbox') {
            set(elem.name, config, !!elem.checked);
        }

        if (elem.type === 'text' || elem.type === 'password' || elem.tagName === 'TEXTAREA') {
            set(elem.name, config, elem.value);
        }
    }

    // console.log('save', config)
    saveObjectToExtStorage(config);
}

// on load, get the value of the whisper-api-key from storage and set the value of the input
window.addEventListener('DOMContentLoaded', async () => {
    config = await loadExtStorage();
        	
    // on customEndpoint click toggle the hidden class
    const customEndpoint = document.getElementById('customEndpoint');
    customEndpoint.addEventListener('click', toggleHidden('#custom-endpoint-options'));
    const advancedDisplaySettings = document.getElementById('advancedDisplaySettings');
    advancedDisplaySettings.addEventListener('click', toggleHidden('#advanced-display-settings'));

    // ['apiUrl', 'apiKey', 'copyToClipboard', 'insertIntoInput', 'showButton']
    for (const elem of [...inputs, ...textareas]) {

        const value = get(elem.name, config);

        if (elem.type === 'checkbox') {
            elem.checked = value;
            elem.addEventListener('click', save);
        }

        if (elem.type === 'text' || elem.type === 'password' || elem.tagName === 'TEXTAREA') {
            elem.value = value;
            elem.addEventListener('input', save);
        }
    }

    if (!config.customEndpoint) {
        toggleHidden('#custom-endpoint-options')();
    }
    if (!config.advancedDisplaySettings) {
        toggleHidden('#advanced-display-settings')();
    }

    const allowRecoringElem = document.getElementById('allowRecording');
    if (allowRecoringElem) {
        allowRecoringElem.checked = await checkMediaAccess((permission) => {
            if (permission.state === 'granted') {
                allowRecoringElem.checked = true;
            } else {
                allowRecoringElem.checked = false;
            }
        });

        allowRecoringElem.addEventListener('click', async (event) => {
            event.preventDefault();

            let hasPermission = await checkMediaAccess();
            if(hasPermission) {
                alert('Microphone access already given to Voice Extension ✅');
                return;
            }

            hasPermission = await requestMediaAccess();
            
            if(!hasPermission) {
                allowRecoringElem.checked = false;
                alert('Microphone access not given to Voice Extension ❌ Please change your page permission settings to use this extension!');
            }
        });
    }
});

const toggleHidden = (selector) => () => {
    const elem = document.querySelector(selector);
    // console.log('elem', elem)
    elem?.classList.toggle('hidden');
}