![release badge](https://github.com/jk-oster/voice-to-text-extension/actions/workflows/release.yaml/badge.svg)

# Voice to Text Extension
## Overview
The Voice to Text extension provides an open transcription integration for any webpage, allowing you to use your voice as prompt input. While initially designed to bring the voice input feature from the ChatGPT mobile app to the browser, this extension can be utilized on any website.

## 🚀 Features
- **Voice to Text**: Record your speech and use the transcription as input for ChatGPT or any other webpage.
- **Text Insertion**: Automatically insert the transcription into the active input field on the page.
- **Copy to Clipboard**: Automatically copy the transcription to your clipboard for easy pasting.
- **UI Integration**: Seamlessly injects a recording button into every page, naturally integrated into the UI.
- **Customizable**: Customize the transcription endpoint, request form data, button injection, and styling according to your preferences.

## 💬 Usage
1. Set your (OpenAI) API key 🔑 in the extension settings.
2. Click on the "record" button 🎙️ on the page or the extension icon in the browser toolbar to start recording (grant microphone usage permission when prompted).
3. Finish/stop ⏹️ the recording by clicking the button again.
4. Once the transcription 🔤 is finished, the resulting text will be inserted into the active input field and copied to your clipboard by default.

Use the keyboard ⌨️ shortcut ``Ctrl + Shift + K`` to start ▶️ and stop ⏹️ the recording.

## 🛡️ Privacy
This extension utilizes Whisper from OpenAI for transcribing recordings, offering fast transcriptions in a variety of languages. You can customize the API endpoint and key if you have Whisper locally installed or prefer another transcription service. The only data stored permanently in the browser are the extension settings.

## 🛡️ Extension Permissions
- **microphone**: Required to record your voice.
- **tabs**: Required to inject the recording button into the ChatGPT interface (and other pages) and paste transcriptions.
- **storage**: Required to store the settings you find below.
- **commands**: Required to bind the keyboard shortcut.

## 🏗️ Development
- clone this repo
- install dependencies with `npm install` or `pnpm install`
- run `npm run dev` or `pnpm run dev` to build the extension
- open the browsers extension settings
- click "load umpacked extension" and select the `dist` folder to install the extension
- the options page should open automatically now

## Contact & contribution
If you need any support feel free to comment in de discussions or open up an issue. You can also contact me though my [website](https://jakobosterberger.com). Contribution, pull requests and suggestions for improvements are very welcome.

## Credits
Thank's to OpenAI Whisper for their awesome translation service. Furthermore, kodos to the creator of the Vite Chrome Extension Plugin for enabling fast and easy extension development!
