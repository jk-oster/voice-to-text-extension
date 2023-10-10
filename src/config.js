export const COLORS = {
    blue: "#236dc9",
    red: "#d53032",
    yellow: "#ffe834",
    green: "#8fce00",
    gray: "#444444",
    violet: '#ab68ff',
    orange: '#ff8c00',
};

export const STATUS = {
    stop: {
        text: "🎙️",
        color: COLORS.violet,
        img: 'assets/micro.svg'
    },
    start: {
        text: "⏹",
        color: COLORS.red,
        img: 'assets/puff.svg'
    },
    offline: {
        text: "🎙️",
        color: COLORS.gray,
        img: 'assets/micro.svg',
    },
    fetching: {
        text: "⌛",
        color: COLORS.orange,
        img: 'assets/oval.svg',
    }
}

export const ACTIONS = {
    toggleRecording: 'toggleRecording',
    startedRecording: 'startedRecording',
    stoppedRecording: 'stoppedRecording',
    audioReady: 'audioBlobAvailable',
    badge: 'badge',
    copyToClipboard: 'copyToClipboard',
    insertIntoInput: 'insertIntoInput',
    showButton: 'showButton',
    apiKeyAdded: 'apiKeyAdded',
    resetRecording: 'resetRecording',
    fetching: 'fetching',
}

export const config = {
    customEndpoint: false,
    advancedDisplaySettings: false,
    extBtnId: 'ext-voice-to-text',
    apiUrl: 'https://api.openai.com/v1/audio/transcriptions',
    apiKey: '',
    formFields: [
        {
            key: 'model',
            value: 'whisper-1'
        },
    ],
    btnCss: `position: fixed; 
bottom: 5px; 
right: 5px; 
z-index: 9999; 
background-color: ${COLORS.violet}; 
transition-duration: .15s;
transition-property: color,background-color,border-color,text-decoration-color,fill,stroke;
border-radius: 50%; 
width: 40px; 
height: 40px;
display: flex;
justify-content: center;
align-items: center;
center; cursor: pointer;`,
    copyToClipboard: true,
    insertIntoInput: true,
    showButton: false,
    defaultInputQuerySelector: [
        'input[type="text"]',
        'input[type="search"]',
        'textarea',
        '[contenteditable]',
        'input',
        '[role="textbox"]'
    ],
    injectRecordButton: [
        {
            url: 'chat.openai.com/',
            selector: '#prompt-textarea',
            css: `position: absolute; 
right: 50px; 
z-index: 9999; 
width: 32px; 
height: 32px; 
line-height: 1; 
text-align: center; 
cursor: pointer;
padding: 0.5rem;
bottom: 0.75rem;
transition-duration: .15s;
transition-property: color,background-color,border-color,text-decoration-color,fill,stroke;
transition-timing-function: cubic-bezier(.4,0,.2,1);
border-radius: 0.375rem; `,
        }
    ],
    status: STATUS,
}

export default config;