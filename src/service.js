import browser from "webextension-polyfill";


export const logMessage = ({ production, verbose }) => (...messages) => {
    const error = new Error();
    // get caller function name from stack trace
    const callerFnName = error.stack.split('\n')[2].split(' ')[5];
    // get caller file name from stack trace
    const callerFileName = error.stack.split('\n')[2].split(' ')[4].split('/').pop();
    // get caller line number from stack trace
    const callerLineNumber = error.stack.split('\n')[2].split(' ')[3].split(':')[1];

    if (production) return;

    if (verbose) return console.log(`%c${callerFnName}() %c${callerFileName}:${callerLineNumber}`, ...messages);

    console.log(...messages);
}

//----------------------------------------------------------------
// Extension Tab Service
//----------------------------------------------------------------

/**
 * Creates a new tab in the browser.
 * @param {string} url - The URL to open in the new tab.
 * @param {boolean} [active=true] - Whether to make the new tab active.
 * @returns {Promise<number>} - A Promise that resolves to the ID of the new tab.
 */
export async function createTab(url, active = true) {
    return browser.tabs.create({ url, active }).then((tab) => tab.id);
}

/**
 * Closes a tab in the browser.
 * @param {number} tabId - The ID of the tab to close.
 * @returns {Promise<void>} - A Promise that resolves when the tab has been closed.
 */
export async function closeTab(tabId) {
    return browser.tabs.remove(tabId);
}

/**
 * Reloads a tab in the browser.
 * @param {number} tabId - The ID of the tab to reload.
 * @returns {Promise<void>} - A Promise that resolves when the tab has been reloaded.
 */
export async function reloadTab(tabId) {
    return browser.tabs.reload(tabId);
}

/**
 * Reloads all tabs in the browser.
 * @returns {Promise<void>} - A Promise that resolves when all tabs have been reloaded.
 */
export async function reloadAllTabs() {
    return browser.tabs.query({}).then((tabs) => {
        for (const tab of tabs) {
            reloadTab(tab.id);
        }
    });
}

/**
 * Gets the URL of the current tab in the browser.
 * @returns {Promise<string>} - A Promise that resolves to the URL of the current tab.
 */
export async function getCurrTabUrl() {
    return browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs[0].url);
}

/**
 * Returns the ID of the currently active tab in the current window, if it matches the given URL pattern.
 * @param {RegExp|null} [matches=null] - A regular expression to match against the URL of the current tab.
 * @returns {Promise<number|undefined>} - A Promise that resolves to the ID of the current tab, or undefined if no matching tab is found.
 */
export async function getCurrTabId(matches = null) {
    return browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        var currTab = tabs[0];
        if (currTab && (!matches || matches.test(currTab.url))) {
            return currTab.id;
        }
        return undefined;
    })
}

/**
 * Gets the URL for an extension page.
 * @param {string} pagePath - The path including filename of the extension page.
 * @returns {string} - The URL of the extension page.
 * */
export function getExtResUrl(pagePath) {
    return browser.runtime.getURL(pagePath);
}

//----------------------------------------------------------------
// Extension Messaging Service
//----------------------------------------------------------------

/**
 * Sends a message to the current tab (content script) that is a webpage using matching http / https .
 * @param {Object} message - The message to send to the tab.
 * @param {string} message.action - The action to perform.
 * @param {Object|null} message.data - The data to send along with the action.
 * @returns {Promise<void>} - A Promise that resolves when the message has been sent.
 */
export async function sendToCurrentTab(message = { action: '', data: null }) {
    try {
        const tabId = await getCurrTabId(/^https?:\/\//);
        sendToTab(tabId, message);
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
export async function sendToTab(tabId, message = { action: '', data: null }) {
    try {
        console.log('sending to tab though browser', tabId, message);
        await browser.tabs.sendMessage(tabId, message);
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
export async function sendToRuntime({ action = '', data = null }, options = {}) {
    try {
        console.log('sending to runtime from browser', action, data);
        await browser.runtime.sendMessage({ action, data }, options);
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
 * @returns {Promise<void>}
 */
export async function addExtensionMessageActionListener(action = 'update', callbackFn = (message, sender, sendRes) => {
}) {
    try {
        browser.runtime.onMessage.addListener(async (message, sender, sendRes) => {
            if ('action' in message && message['action'] === action) {
                console.log('received runtime message from browser', message);
                callbackFn(message?.data ?? message, sender, sendRes);
            }
        });
    } catch (e) {
        console.log(e)
    }
}

/**
 * Add a listener in the runtime (background service) for clicks on the extension icon in the browser toolbar (top right)
 * @param {function} callbackFn - The function to be called when the icon is clicked.
 * @returns {Promise<void>}
 */
export function addExtensionIconClickListener(callbackFn = async (tab, info) => {
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
export function addExtensionCommandListener(command = 'update', callbackFn = (command, tab) => {
}) {
    try {
        browser.commands.onCommand.addListener(async (command, tab) => {
            console.log('received command from browser', command, tab);
            callbackFn(command, tab);
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

export async function loadExtStorage() {
    return browser.storage.sync.get();
}

/**
 * Save all changes from extension storage change event to store object
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
 * Sets the badge text for the browser action on the current tab in the browser toolbar (top right) from runtime (background service)
 * @param {string} text - The text to set as the badge.
 * @param {RegExp|null} [matches=null] - An optional Regex pattern to match URL against.
 */
export async function setBadgeText(text, matches = null) {
    const tabId = await getCurrTabId(matches);
    if (!tabId) {
        console.log('no tab id found');
        return;
    }
    browser.action.setBadgeText({ text, tabId });
}

/**
 * Sets the badge color of the extension icon in the browser toolbar (top right) from runtime (background service)
 * @param {string} colorMapping - mapping of color names to hex values 
 * @returns {RegExp|null} - Regex pattern to match URL against. 
 */
export const setBadgeColor = async (color, matches = null) => {
    console.log('setting badge color', color, matches)
    const tabId = await getCurrTabId(matches);
    if (!tabId) {
        console.log('no tab id found');
        return;
    }
    browser.action.setBadgeBackgroundColor({ color, tabId });
}

/**
 * Sets the badge status (text & volor) of the extension icon in the browser toolbar (top right) from runtime (background service)
 * @param {string} status.text - status text
 * @param {string} status.color - hex color code
 * @returns {Function} - A function that takes a status object and optional matches array, and sets the badge color and text accordingly.
 */
export const setBadgeStatus = ({ text, color }, matches = null) => {
    console.log('setting badge status', text, color, matches)
    setBadgeColor(color, matches);
    setBadgeText(text, matches);
}

//----------------------------------------------------------------
// Extension Background Function Calling Service
//----------------------------------------------------------------

const CALL_FUNCTION = 'ext:callFunction';
const GET_EXPOSED_FUNCTIONS = 'ext:getExposedFunctions';

export const setupExposedBackGroundFunctions = (functionsObj = { ...bgFunctions }) => {
    browser.runtime.onMessage.addEventListener(async (msg, sender, sendRes) => {
        if (msg.action === CALL_FUNCTION && msg.functionName && functionsObj[functionName]) {

            console.log('found function in background', func);
            try {
                const result = await functionsObj[functionName](...args, { msg, sender });
                sendRes({
                    result
                });
            } catch (error) {
                console.log('error calling bg function', error);
                sendRes({
                    error
                });
            }
        }
        else if (msg.action === GET_EXPOSED_FUNCTIONS) {
            sendRes({
                exposedFunctions: Object.keys(functionsObj)
            });
        }
    });
}

export const callBackgroundFunction = (functionName, args, callbackFn) => {
    browser.runtime.sendMessage({
        action: CALL_FUNCTION,
        functionName: functionName,
        args: args
    }, callbackFn);
}

function getExposedBackgroundFunctions(callbackFn) {
    chrome.runtime.sendMessage({ action: GET_EXPOSED_FUNCTIONS }, (response) => {
        const exposedFunctions = response.exposedFunctions || {};
        const bgFns = {};

        Object.keys(exposedFunctions).forEach((functionName) => {
            bgFns[functionName] = async (...args) => {
                return new Promise((resolve) => {
                    callBackgroundFunction(functionName, args, (response) => {
                        resolve(response.result);
                    });
                });
            };
        });

        callbackFn(bgFns);
    });
}
