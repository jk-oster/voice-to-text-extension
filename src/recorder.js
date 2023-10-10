/**
 * Wrapper for the mediaRecorder API
 * Records audio and creates a blob from it
 * @emits audioBlobAvailable
 * @emits startedRecording
 * @emits stoppedRecording
 * @listens resetRecording
 */
class AudioRecorder {
    mediaRecorder;
    recordedChunks = [];

    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];

        addEventListener('resetRecording', () => {
            this.recordedChunks = [];
        });
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.recordedChunks, { type: 'audio/wav' });
                const event = new CustomEvent('audioBlobAvailable', { detail: audioBlob });
                window.dispatchEvent(event);
            };

            this.mediaRecorder.start();
            // throw an event 'startedRecording'
            const event = new CustomEvent('startedRecording');
            window.dispatchEvent(event);
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        // throw new event 'stoppedRecording'
        const event = new CustomEvent('stoppedRecording');
        window.dispatchEvent(event);
    }

    getState() {
        return this.mediaRecorder?.state ?? 'inactive';
    }

    async toggleRecording() {
        if (this.getState() === 'recording') {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

}

/**
 * Wrapper for the mediaRecorder API
 * Records audio and creates a blob from it
 * @emits audioBlobAvailable
 * @emits startedRecording
 * @emits stoppedRecording
 * @listens resetRecording
 */
const recorder = new AudioRecorder();
export default recorder;