import { saveToExtStorage, loadFromExtStorage, sendToRuntime } from "../service";

// on load, get the value of the whisper-api-key from storage and set the value of the input
window.addEventListener('DOMContentLoaded', async () => {
    const whisperApiKey = await loadFromExtStorage('whisperApiKey');
    document.getElementById('whisper-api-key').value = whisperApiKey ?? '';

    // on input of the whsiper-api-key inout, save the value to storage
    document.getElementById('whisper-api-key').addEventListener('input', (event) => {
        const whisperApiKey = event.target.value;
        if (!whisperApiKey) return;
        saveToExtStorage('whisperApiKey', whisperApiKey);
        sendToRuntime({ action: 'apiKeyAdded' });
    });
})

