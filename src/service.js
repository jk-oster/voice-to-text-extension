import browser from "webextension-polyfill";

//----------------------------------------------------------------
// Extension Messaging Service
//----------------------------------------------------------------

/**
 * Returns the ID of the currently active tab in the current window, if it matches the given URL pattern.
 * @param {RegExp|null} [matches=null] - A regular expression to match against the URL of the current tab.
 * @returns {Promise<number|undefined>} - A Promise that resolves to the ID of the current tab, or undefined if no matching tab is found.
 */
async function getCurrTabId(matches = null) {
    return browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        var currTab = tabs[0];
        if (currTab && (!matches || matches.test(currTab.url))) {
            return currTab.id;
        }
        return undefined;
    })
}

/**
 * Sends a message to the current tab (content script) that is a webpage using matching http / https .
 * @param {Object} message - The message to send to the tab.
 * @param {string} message.action - The action to perform.
 * @param {Object|null} message.data - The data to send along with the action.
 * @param {boolean} [triggerWindowEvent=false] - Whether to trigger a window event after sending the message.
 * @returns {Promise<void>} - A Promise that resolves when the message has been sent.
 */
export async function sendToCurrentTab(message = { action: '', data: null }, triggerWindowEvent = false) {
    try {
        const tabId = await getCurrTabId(/^https?:\/\//);
        sendToTab(tabId, message, triggerWindowEvent);
    } catch (e) {
        console.log(e)
    }
}

/**
 * Sends a message to a specified tab (content script).
 * @param {number} tabId - The ID of the tab to send the message to.
 * @param {Object} message - The message to send to the tab. Should have an 'action' property and a 'data' property.
 * @param {string} message.action - The action to perform.
 * @param {any} message.data - The data to send along with the action.
 * @param {boolean} [triggerWindowEvent=false] - Whether or not to trigger a window event after sending the message.
 */
export async function sendToTab(tabId, message = { action: '', data: null }, triggerWindowEvent = false) {
    try {
        await browser.tabs.sendMessage(tabId, message);

        if (!window && triggerWindowEvent) {
            console.log('no window context found');
            return;
        }
        if (triggerWindowEvent) {
            dispatchWindowMessage(action, data);
        }
    } catch (e) {
        console.log(e)
    }
}

/**
 * Sends a message to the browser runtime (background service) with the given action and data.
 * 
 * @param {Object} message - The message object.
 * @param {string} message.action - The action to be performed.
 * @param {any} message.data - The data to be sent along with the action.
 * @param {boolean} [triggerWindowEvent=false] - Whether to trigger a window event after sending the message.
 * @returns {Promise<void>} - A promise that resolves when the message has been sent.
 */
export async function sendToRuntime({ action = '', data = null }, triggerWindowEvent = false) {
    try {
        console.log('sending to runtime from browser', action, data);
        await browser.runtime.sendMessage({ action, data });

        if (window && triggerWindowEvent) {
            dispatchWindowMessage(action, data);
        }
    } catch (e) {
        console.log(e)
    }
}

/**
 * Sends a message to all tabs (content scripts) matching the specified query and URL match.
 * @param {Object} tabsQuery - The query to match tabs against.
 * @param {RegExp|null} urlMatch - The URL pattern to match tabs against.
 * @param {Object} message - The message to send.
 * @param {string} message.action - The action to perform.
 * @param {any} message.data - The data to send with the message.
 * @returns {Promise<void>} - A promise that resolves when all messages have been sent.
 */
export async function sendToAllTabsMatching({ query: tabsQuery = {}, urlMatch = null }, { action = '', data = null }) {
    try {
        await browser.tabs.query(tabsQuery).then(async (tabs) => {
            console.log('sending to all tabs though browser', tabs);
            for (const tab of tabs) {
                if (urlMatch && !urlMatch.test(tab.url)) continue;
                console.log('sending to tab though browser', tab);
                sendToTab(tab.id, { action, data });
            }
        });
    } catch (e) {
        console.log(e)
    }
}

/**
 * Adds a listener for extension messages with a specified action.
 * @param {string} action - The action to listen for.
 * @param {function} callbackFn - The function to call when a message with the specified action is received.
 * @param {boolean} addWindowListener - Whether to add a window event listener in addition to the runtime message listener.
 * @returns {Promise<void>}
 */
export async function addExtensionMessageActionListener(action = 'update', callbackFn = (message, sender) => {
}, addWindowListener = false) {
    try {
        browser.runtime.onMessage.addListener(async (message, sender) => {
            if ('action' in message && message['action'] === action) {
                console.log('received runtime message from browser', message);
                callbackFn(message?.data ?? message, sender);
            }
        });

        if (!window && addWindowListener) {
            console.log('no window context found');
            return;
        }
        if (addWindowListener) {
            addEventListener(action, (data) => {
                console.log('received event message from window', data);
                callbackFn(data);
            });
        }
    } catch (e) {
        console.log(e)
    }
}

/**
 * Add a listener in the runtime (background service) for clicks on the extension icon in the browser toolbar (top right)
 * @param {function} callbackFn - The function to be called when the icon is clicked.
 * @returns {Promise<void>}
 */
export async function addExtensionIconClickListener(callbackFn = async (tab, info) => {
}) {
    try {
        browser.action.onClicked.addListener(async (tab, info) => {
            console.log('received icon click from browser', tab, info);
            callbackFn(tab, info);
        });
    }
    catch (e) {
        console.log(e)
    }
}

/**
 * Adds a listener in the runtime (background service) for a specific extension command (keyboard shortcut)
 * @param {string} command - The name of the command to listen for.
 * @param {function} callbackFn - The function to call when the command is received.
 * @returns {Promise<void>}
 */
export async function addExtensionCommandListener(command = 'update', callbackFn = (command) => {
}) {
    try {
        browser.commands.onCommand.addListener(async (command) => {
            console.log('received command from browser', command);
            callbackFn(command);
        });
    } catch (e) {
        console.log(e)
    }
}

/**
 * Dispatches a custom event with the specified action and data to the window object.
 * @param {string} action - The name of the custom event to dispatch.
 * @param {object} data - The data to be passed along with the custom event.
 */
export function dispatchWindowMessage(action = '', data = {}) {
    if (!window) {
        console.log('no window context found');
        return;
    }
    const event = new CustomEvent(action, { detail: data });
    window.dispatchEvent(event);
}

//----------------------------------------------------------------
// Extension Storage Service
//----------------------------------------------------------------

/**
 * Saves a key-value pair to the browser's extension storage.
 *
 * @param {string} propName - The name of the key to save.
 * @param {any} value - The value to save.
 */
export function saveToExtStorage(propName, value) {
    browser.storage.sync.set({
        [propName]: value,
    });
}

/**
 * Save multiple values (object) to extension storage to persist them across sessions, pages & devices
 * @param {Object} obj to be saved to the extension storage
 */
export function saveObjectToExtStorage(obj) {
    browser.storage.sync.set(obj);
}

/**
 * Load a single value from extension storage
 * @param {string} propName of the value to load from extension storage
 * @returns {Promise<any>} value of the property from extension storage
 */
export async function loadFromExtStorage(propName) {
    return browser.storage.sync.get(propName).then((result) => {
        return result[propName] ?? null;
    });
}

/**
 * Save all changes from extension storage cahnge event to store object
 * @param {Object} store to save changes to
 */
export const saveExtStorageChangesTo = (store = {}) => (changes) => {
    for (const key in changes) {
        if (store[key] === changes[key].newValue) continue
        store[key] = changes[key].newValue;
    }
}

/**
 * Sets storage change listeners for both sync and local storage areas.
 * @param {function[]} syncFunctions - An array of functions to be called when a change occurs in the sync storage area.
 * @param {function[]} localFunctions - An array of functions to be called when a change occurs in the local storage area.
 */
export function setStorageChangeListeners(syncFunctions = [], localFunctions = []) {
    browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync") {
            for (const func of syncFunctions) {
                func(changes);
            }
        } else if (areaName === "local") {
            for (const func of localFunctions) {
                func(changes);
            }
        }
    });
}

/**
 * Initialize extension storage listeners to to sync extension storage changes to store object (sync ext->store)
 * @param {Object} store object to sync extension storage changes to
 */
export function syncExtensionStorageChangesTo(store = {}) {
    setStorageChangeListeners([saveExtStorageChangesTo(store)], [saveExtStorageChangesTo(store)]);
}


/**
 * Adds a listener for changes to a specific property in the extension storage.
 * @param {string} propName - The name of the property to listen for changes.
 * @param {function} callbackFn - The function to call when the property changes. Defaults to an empty function.
 * @param {string} storageAreaName - The name of the storage area to listen for changes. Defaults to "sync".
 */
export function addExtensionStorageValueListener(propName, callbackFn = (newValue) => { }, storageAreaName = "sync") {
    browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === storageAreaName && propName in changes) {
            callbackFn(changes[propName].newValue);
        }
    });
}

//----------------------------------------------------------------
// Extension Badge Service
//----------------------------------------------------------------

/**
 * Sets the badge text for the browser action on the current tab in the browser toolbar (top right).
 * @param {string} text - The text to set as the badge.
 * @param {RegExp|null} [matches=null] - An optional Regex pattern to match URL against.
 */
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
 * @returns {Function} - A function that takes a status object and optional matches array, and sets the badge color and text accordingly.
 */
const setBadgeStatus = (colors, statusMapping) => ({status, text, hexColor}, matches = null) => {
    const config = statusMapping[status];
    setBadgeColor(colors)(hexColor ?? config.color, matches);
    setBadgeText(text ?? config.text, matches);
}
