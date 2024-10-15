import { saveToExtStorage } from "./service.js";

export function requestMediaAccess(permissionChange = (permissionStatus) => {}) {

    return new Promise(async (resolve, reject) => {
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                console.log("Microphone access granted to Voice Extension");

                // Stop the tracks to prevent the recording indicator from being shown
                stream.getTracks().forEach(function (track) {
                    track.stop();
                });

                resolve(true);
            })
            .catch((error) => {
                console.warn("Error requesting microphone permission for Voice Extension", error);
                saveToExtStorage('allowRecoring', false);
                resolve(false);
            });
    });
}

export async function checkMediaAccess(permissionChange = (permissionStatus) => {}) {
     try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' });

        permissionStatus.onchange = () => {
            console.log('Microphone permission status changed to:', permissionStatus.state);
            
            permissionChange(permissionStatus);

            if(permissionStatus.state === 'granted') {
                saveToExtStorage('allowRecoring', true);
            } else {
                saveToExtStorage('allowRecoring', false);
            }
        };

        if (permissionStatus.state === 'granted') {
            saveToExtStorage('allowRecoring', true);
            return true;
        } else {
            
        }            
    } catch (err) {
        saveToExtStorage('allowRecoring', false);
        return false;
    }
}

export function requestClipboardAccess() {
    const text = navigator.clipboard.readText();
    const clipboardText = navigator.clipboard.writeText(text);
    return clipboardText;
}