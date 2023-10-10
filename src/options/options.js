import { saveObjectToExtStorage, loadExtStorage } from "../service";
import main from "./main.css"; // eslint-disable-line no-unused-vars // returns css as string

let config;
const inputs = document.querySelectorAll('input');
const textareas = document.querySelectorAll('textarea');
injectCss(main);

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

function injectCss(cssString) {
    let head = document.getElementsByTagName('HEAD')[0];
    let style = document.createElement('style');
    style.innerHTML = cssString;
    head.appendChild(style);
}

function save() {
    for (const elem of inputs) {

        if (elem.type === 'checkbox') {
            set(elem.name, config, !!elem.checked);
        }

        if (elem.type === 'text' || elem.tagName === 'TEXTAREA') {
            set(elem.name, config, elem.value);
        }
    }

    console.log('save', config)
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

        if (elem.type === 'text' || elem.tagName === 'TEXTAREA') {
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
});

const toggleHidden = (selector) => () => {
    const elem = document.querySelector(selector);
    console.log('elem', elem)
    elem?.classList.toggle('hidden');
}