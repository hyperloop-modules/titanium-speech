var TiSpeech = require('ti.speech');
TiSpeech.initialize();

var canRecordAudio = false;
var canUseSpeechRecognition = false;
var isRunning = false;


Ti.Media.requestAudioRecorderPermissions(function(e){
  if (e.success) {
    if (!TiSpeech.isAvailable()) {
        alert('Speech recognition is not available on this device!');
    } else {
      enableButtons();
    }
  }
});


/**
 * @function enableButtons
 * @summary Enable buttons based on permissions granted by user
 * @since 1.0.0
 */
function enableButtons() {
    $.toggleLiveRecognitionButton.enabled = true;
    $.toggleAudioRecognitionButton.enabled = true;
    $.toggleVideoRecognitionButton.enabled = true;
}

/**
 * @function stopRecognition
 * @summary Stops voice recognition and resets buttons
 * @since 1.0.0
 */
function stopRecognition() {

    if (isRunning) {
        TiSpeech.stopRecognition();
    }

    isRunning = false;

    $.toggleLiveRecognitionButton.title = 'Start Listening to Live Audio';
    $.toggleAudioRecognitionButton.title = 'Start Listening to Audio File';
    $.toggleVideoRecognitionButton.title = 'Start Listening to Video File';

    $.toggleLiveRecognitionButton.enabled = true;
    $.toggleAudioRecognitionButton.enabled = true;
    $.toggleVideoRecognitionButton.enabled = true;
}

/**
 * @function progressCallback
 * @summary Function used to report progress of speech recognition
 * @param {object} result - Resulting progress object
 * @param {boolean} result.finished - Indicates if the speech recognition has completed
 * @param {object} result.error - If an error occurred, this parameter will contain the error information
 * @param {string} result.value - Transcript of the recognized speech
 * @since 1.0.0
 */
function progressCallback(result) {
    if (result.error) {
        console.error('An error occurred with speech recognition');
        console.error(result.error);
        if (result.error.toString().match(/Timeout/g)) {
            alert('Time limit exceeded for speech recognition');
        } else {
            alert('An error occurred with speech recognition');
        }
        stopRecognition();
        return;
    } else {
        $.results.text = result.value;
    }
    if (result.finished) {
        isRunning = false;
        stopRecognition();
    }
}

function toggleLiveRecognition(e) {
    TiSpeech.initialize();

    if (isRunning) {
        stopRecognition();
    } else {
        $.results.text = 'Listening...';

        var success = TiSpeech.startRecognition({
            progress: progressCallback,
        });

        if (success) {
            isRunning = true;
            $.toggleLiveRecognitionButton.title = 'Stop Listening';
        }
    }
}

function toggleAudioRecognition(e) {
    // Initializing with locale 'en_US' because audio is in English
    TiSpeech.initialize('en_US');

    if (isRunning) {
        stopRecognition();
    } else {
        $.results.text = 'Loading Audio File...';
        var success = TiSpeech.startRecognition({
            type: TiSpeech.SOURCE_TYPE_URL,
            url: 'one_more_thing.mp3',
            progress: progressCallback,
        });

        if (success) {
            isRunning = true;
            $.toggleAudioRecognitionButton.title = 'Stop Listening';
        }
    }
}

function toggleVideoRecognition(e) {
    TiSpeech.initialize('en_GB');

    if (isRunning) {
        stopRecognition();
    } else {
        $.results.text = 'Loading Video File...';

        var success = TiSpeech.startRecognition({
            type: TiSpeech.SOURCE_TYPE_URL,
            url: 'hyperloop.mp4',
            progress: progressCallback,
        });
        if (success) {
            isRunning = true;
            $.toggleVideoRecognitionButton.title = 'Stop Listening';
        }
    }
}

$.index.open();
