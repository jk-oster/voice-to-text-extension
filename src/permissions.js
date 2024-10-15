export function requestMediaAccess() {
    // Request user media access
    return new Promise((resolve, reject) => {
        // Using navigator.mediaDevices.getUserMedia to request microphone access
        navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
            // Permission granted, handle the stream if needed
            console.log("Microphone access granted to Voice Extension");

            // Stop the tracks to prevent the recording indicator from being shown
            stream.getTracks().forEach(function (track) {
                track.stop();
            });

            resolve();
        })
        .catch((error) => {
            console.warn("Error requesting microphone permission for Voice Extension", error);

            reject(error);
        });
    });
}

export function requestClipboardAccess() {
    const text = navigator.clipboard.readText();
    const clipboardText = navigator.clipboard.writeText(text);
    return clipboardText;
}