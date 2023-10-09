export const colors = {
    blue: "#236dc9",
    red: "#d53032",
    yellow: "#ffe834",
    green: "#8fce00",
    gray: "#444444",
    violet: '#ab68ff',
    orange: '#ff8c00',
};

export const status = {
    stop: {
        text: "🎙️",
        color: colors.violet
    },
    start: {
        text: "⏹",
        color: colors.red
    },
    offline: {
        text: "🎙️",
        color: colors.gray
    },
    fetching: {
        text: "⌛",
        color: colors.orange
    }
}

export const actions = {
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
    apiUrl: 'https://api.openai.com/v1/audio/transcriptions',
    apiKey: '',
    formFields: [
        {
            key: 'model',
            value: 'whisper-1'
        },
    ],
    btnCss: `
    position: fixed; 
    bottom: 5px; 
    right: 5px; 
    z-index: 9999; 
    background-color: ${colors.violet}; 
    border-radius: 50%; 
    width: 40px; 
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    center; cursor: pointer;
    `,
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
    injectRecordButtonMatching: [
        {
            url: 'chat.openai.com/',
            selector: '#prompt-textarea'
        }
    ],
    status,
}

export default config;