import { ACTIONS } from "../config.js";
import { getExtResUrl, loadFromExtStorage } from "../service.js";

injectRecorderIframe();

window.addEventListener('message', (event) => {
    // console.log('message from iFrame received', event);
    
    const url = getExtResUrl('src/recorder/recorder.html');
    const origin = new URL(url).origin;

    // console.log('origin', origin, event.origin == origin);

    if (event.origin !== origin) return;

    if (event.data.action === ACTIONS.transcriptReady) {
        insertTextIntoInput(event.data.text);
    }
});

let lastFocusedElement = document.activeElement;
window.addEventListener('focusin', (event) => {
    // console.log('focusin', event);
    if(event.target === lastFocusedElement) return;
    if(event.target.tagName === 'IFRAME') return;

    lastFocusedElement = event.target;
});

async function injectRecorderIframe() {    
    const url = getExtResUrl('src/recorder/recorder.html');
    const iframe = document.createElement('iframe');
    iframe.allow = 'microphone';
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('frame-border', '0');
    iframe.style.position = 'fixed';
    iframe.style.bottom = '10px';
    iframe.style.right = '10px';
    iframe.style.zIndex = '9999';
    iframe.style.width = '40px';
    iframe.style.borderRadius = '50%';
    iframe.style.height = '40px';
    iframe.style.border = '0';
    iframe.style.background = 'none transparent';
    iframe.src = url;

    const showButton = await loadFromExtStorage('showButton');
    const injectRecordButtonUrls = await loadFromExtStorage('injectRecordButtonUrls');

    const matchedUrl = injectRecordButtonUrls?.split(',').some(url => window.location.href.includes(url));
    const shouldShow = showButton || matchedUrl;

    if (!shouldShow) {
        iframe.hidden = 'true';
        iframe.style.display = 'none';
    }

    document.body.appendChild(iframe);

    // console.log('Voice Extension Recorder iFrame successfully injected');

    return iframe;
}

async function insertTextIntoInput(text) {
    if(!text || typeof text !== 'string') return;

    let insertIntoInput = await loadFromExtStorage('insertIntoInput');
    let insertIntoInputIds = await loadFromExtStorage('insertIntoInputIds') ?? '#ihopefillydontexistlol';

    const insert = (element, text) => {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            const hasText = (element?.value?.trim() ?? '') !== '';
            element.value += (hasText ? ' ' : '') + text;
        }
        if (element.isContentEditable) {
            const hasText = (element?.textContent?.trim() ?? '') !== '';
            element.textContent += (hasText ? ' ' : '') + text;
        }
    }
    
    if (lastFocusedElement && insertIntoInput) {
        insert(lastFocusedElement, text);
    }

    try {
        const inputs = document.querySelectorAll(insertIntoInputIds);
        for (const input of inputs) {
            insert(input, text);
        }
    }
    catch (error) {
        console.warn(error);
    }

}
