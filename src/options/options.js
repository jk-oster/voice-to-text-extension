import { saveObjectToExtStorage, loadExtStorage } from "../service";

const inputs = document.querySelectorAll('input');

function save() {
    const data = {};

    for(const elem of inputs) {
        if (elem.type === 'checkbox') {
            data[elem.id] = !!elem.checked;
        }

        if (elem.type === 'text') {
            data[elem.id] = elem.value;
        }
    }

    console.log('save', data)
    saveObjectToExtStorage(data);
}

// on load, get the value of the whisper-api-key from storage and set the value of the input
window.addEventListener('DOMContentLoaded', async () => {
    const config = await loadExtStorage();

    // ['apiUrl', 'apiKey', 'copyToClipboard', 'insertIntoInput', 'showButton']
    for (const elem of inputs) {
        const value = config[elem.id];

        // if input type = checkbox
        if (elem.type === 'checkbox') {
            elem.checked = value;
            elem.addEventListener('click', save);
        }

        if (elem.type === 'text') {
            elem.value = value;
            elem.addEventListener('input', save);
        }
    }
})

