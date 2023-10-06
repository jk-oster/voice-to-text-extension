import browser from "webextension-polyfill";
import { sendToCurrentContentScript, addExtensionCommandListener } from "@/service";
import { addExtensionIconClickListener, addExtensionMessageActionListener, loadFromExtStorage } from "./service";

const colors = {
    blue: "#236dc9",
    red: "#d53032",
    yellow: "#ffe834",
    green: "#8fce00",
    gray: "#444444",
};

const statusMapping = {
    stop: {
        text: "🎙️",
        color: colors.blue
    },
    start: {
        text: "⏹️",
        color: colors.red
    },
    offline: {
        text: "🎙️",
        color: colors.gray
    },
};

browser.runtime.onInstalled.addListener(async () => {
    console.log("Background Service Installed");

    // let url = browser.runtime.getURL("options/options.html");
    // await browser.tabs.create({ url });

    setBadgeStatus(colors, statusMapping)("offline");

    const whisperApiKey = await loadFromExtStorage("whisperApiKey");
    if (!whisperApiKey) {
        console.log("no whisper api key found");
        browser.runtime.openOptionsPage();
    }
});

addExtensionIconClickListener(() => {
    sendToCurrentContentScript({ action: 'toggleRecording' });
});

addExtensionCommandListener('toggleRecording', () => {
    sendToCurrentContentScript({ action: 'toggleRecording' });
});

addExtensionMessageActionListener('badge', (status) => {
    setBadgeStatus(colors, statusMapping)({status});
});

// Log all messages from the extension runtime
browser.runtime.onMessage.addListener((message) => {
    console.log('logging received message from background service', message);
});

async function getCurrTabId(matches = null) {
    return browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        var currTab = tabs[0];
        if (currTab && (!matches || matches.test(currTab.url))) {
            return currTab.id;
        }
        return undefined;
    })
}

// Sets the badge text of the extension icon in the browser toolbar (top right)
async function setBadgeText(text, matches = null) {
    const tabId = await getCurrTabId(matches);
    if (!tabId) {
        console.log('no tab id found');
        return;
    }
    browser.action.setBadgeText({ text, tabId });
}

/**
 * Sets the badge color of the extension icon in the browser toolbar (top right)
 * @param {Object} colorMapping - mapping of color names to hex values  
 */
const setBadgeColor = (colorMapping) => async (colorName, matches = null) => {
    const tabId = await getCurrTabId(matches);
    if (!tabId) {
        console.log('no tab id found');
        return;
    }
    const color = colorMapping[colorName];
    browser.action.setBadgeBackgroundColor({ color, tabId });
}

/**
 * Sets the badge status (text & volor) of the extension icon in the browser toolbar (top right)
 * @param {Object} colors - mapping of color names to hex values
 * @param {Object} statusMapping - mapping of status { statusName: { text , color },... }
 */
const setBadgeStatus = (colors, statusMapping) => ({status, text, hexColor}, matches = null) => {
    const config = statusMapping[status];
    setBadgeColor(colors)(hexColor ?? config.color, matches);
    setBadgeText(text ?? config.text, matches);
}
