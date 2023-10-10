import browser from "webextension-polyfill";
import {
    sendToCurrentTab,
    addExtensionCommandListener,
    setBadgeStatus,
    addExtensionIconClickListener,
    addExtensionMessageActionListener,
    loadExtStorage,
    saveObjectToExtStorage,
    loadFromExtStorage,
    addExtensionStorageValueListener,
    openOptionsPage,
} from "./service";
import config, { ACTIONS } from "./config";

browser.runtime.onInstalled.addListener(async () => {
    console.log("Background Service Installed");


    // let url = browser.runtime.getURL("options/options.html");
    // await browser.tabs.create({ url });

    setBadgeStatus(config.status.offline);

    const oldConfig = await loadExtStorage() ?? {};
    console.log("Config", config);
    console.log("Config", oldConfig);

    saveObjectToExtStorage({ ...config, ...oldConfig });

    const apiKey = await loadFromExtStorage("apiKey");

    if (!apiKey) {
        console.log("no whisper api key found");
        openOptionsPage();
    }
});

addExtensionIconClickListener(() => {
    sendToCurrentTab({ action: ACTIONS.toggleRecording });
});

addExtensionCommandListener(ACTIONS.toggleRecording, () => {
    sendToCurrentTab({ action: ACTIONS.toggleRecording });
});

addExtensionMessageActionListener(ACTIONS.badge, ({ color, text }) => {
    setBadgeStatus({ color, text });
});

addExtensionStorageValueListener('apiKey', (apiKey) => {
    console.log('apiKey changed', apiKey);
});

// Log all messages from the extension runtime
browser.runtime.onMessage.addListener((message) => {
    console.log('logging received message from background service', message);
});

function test(text) {
    return "ich bin das ergebnis einer test funktion mit argument " + text;
}

setupExposedBackGroundFunctions({
    test,
});
