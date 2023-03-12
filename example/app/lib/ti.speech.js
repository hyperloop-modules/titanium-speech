'use strict';
/***
 * @file Use Speech Recognition functionality in iOS 10
 * @module ti.speech
 * @author Hans Knöchel <hknoechel@axway.com>
 * @author Brenton House <brenton.house@gmail.com>
 * @requires Hyperloop
 * @requires Speech
 * @version 1.0.0
 * @since 1.0.0
 */
import { AVAudioEngine } from 'AVFAudio';
import { AVAudioSession, AVFoundation } from 'AVFoundation';
import { NSBundle, NSError, NSLocale, NSURL } from 'Foundation';
import { SFSpeechAudioBufferRecognitionRequest, SFSpeechRecognitionRequest,SFSpeechRecognitionResult,
SFSpeechRecognitionTask, SFSpeechRecognizer, SFSpeechURLRecognitionRequest, Speech } from 'Speech';

var audioEngine;
var request;
var recognitionTask;
var speechRecognizer;
var SOURCE_TYPE_URL = 'url';
var SOURCE_TYPE_MICROPHONE = 'microphone';

/**
 * @function initialize
 * @summary Creates a speech recognizer for the specified locale, if supported.
 * @param {string} locale - Locale to use for initializing speech recognizer
 * @since 1.0.0
 */
exports.initialize = function(locale) {
    if (speechRecognizer) {
        speechRecognizer = null;
        // Can't delete local variable in strict mode
        // delete speechRecognizer;
    }

    if (locale) {
        speechRecognizer = SFSpeechRecognizer.alloc().initWithLocale(NSLocale.alloc().initWithLocaleIdentifier(locale));
    } else {
        speechRecognizer = new SFSpeechRecognizer();
    }
};

/**
 * Callback used for reporting success of requesting permissions for features
 * @callback permissionCallback
 * @param {object} param - Object that contains info about the success of the request
 * @param {string} param.message - Friendly message regarding the success or failure of request
 * @param {number} param.status - Status of the permission request as returned from the OS
 * @param {boolean} param.success - Value is true, if request was successful, otherwise false
 */

/**
 * @function requestSpeechRecognizerAuthorization
 * @summary Asks the user to grant your app permission to perform speech recognition.
 * @param {permissionCallback} callback - A function that is called when the authorization request has been approved or denied.
 * @since 1.0.0
 */
exports.requestSpeechRecognizerAuthorization = function(callback) {
    SFSpeechRecognizer.requestAuthorization(function(status) {
        var success = false;
        var message = '';

        switch (status) {
            case Speech.SFSpeechRecognizerAuthorizationStatusAuthorized:
                // User gave access to speech recognition
                message = 'User gave access to speech recognition';
                success = true;
                break;

            case Speech.SFSpeechRecognizerAuthorizationStatusDenied:
                // User denied access to speech recognition
                message = 'User denied access to speech recognition';
                break;

            case Speech.SFSpeechRecognizerAuthorizationStatusRestricted:
                // Speech recognition restricted on this device
                message = 'Speech recognition restricted on this device';
                break;

            case Speech.SFSpeechRecognizerAuthorizationStatusNotDetermined:
                // Speech recognition not yet authorized
                message = 'Speech recognition not yet authorized';
                break;

            default:
                // Should not be here.  Issue should be resolved in Hyperloop 2.0.2.
                message = 'Something has gone wrong requesting Speech Recogniction authorization';
                break;
        }

        // TODO:  Temporarily setting success to true until Hyperloop 2.0.2, https://jira.appcelerator.org/browse/TIMOB-23902
        success = true;

        callback({
            success: success,
            message: message,
            status: status,
        });
    });
};

/**
 * @function requestMicrophoneAuthorization
 * @summary Asks the user to grant your app permission to record audio using microphone.
 * @param {permissionCallback} callback - A function that is called when the authorization request has been approved or denied.
 * @since 1.0.0
 */
exports.requestMicrophoneAuthorization = function(callback) {
    var audioSession = new AVAudioSession();

    audioSession.requestRecordPermission(function(status) {
        var success = false;
        var message = '';

        switch (status) {
            case AVFoundation.AVAudioSessionRecordPermissionGranted:
                // Recording permission has been granted.
                message = 'Recording permission has been granted.';
                success = true;
                break;

            case AVFoundation.AVAudioSessionRecordPermissionDenied:
                // Recording permission has been denied.
                message = 'Recording permission has been denied.';
                break;

            case AVFoundation.SFSpeechRecognizerAuthorizationStatusRestricted:
                // Recording permission has not been granted or denied. This typically means that permission has yet to be requested, or is in the process of being requested.
                message = 'Recording permission has not been granted or denied. This typically means that permission has yet to be requested, or is in the process of being requested.';
                break;

            default:
                // Should not be here.  Issue should be resolved in Hyperloop 2.0.2.
                message = 'Something has gone wrong while requesting authorization to record';
                break;
        }

        // TODO:  Temporarily setting success to true until Hyperloop 2.0.2, https://jira.appcelerator.org/browse/TIMOB-23902
        success = true;

        callback({
            success: success,
            message: message,
            status: status,
        });
    });
};


/**
 * Indicates whether the speech recognizer is available.
 * Even though a speech recognizer is supported for a specific locale,
 * it might be unavailable for reasons such as a nonfunctioning Internet connection.
 * @function isAvailable
 * @summary Indicates whether the speech recognizer is available.
 * @since 1.0.0
 * @returns {boolean} - A Boolean value that indicates whether the speech recognizer is available.
 */
exports.isAvailable = function() {
    return speechRecognizer && speechRecognizer.isAvailable();
};

/**
 * This callback is used to report progress on speech Recognition
 * @callback progressCallback
 * @param {object} param - Object that contains info about the state of the speech recognition
 * @param {string} param.value - Text transcription of speech recognition
 * @param {object} param.error - Contains any error returned from the speech recognition engine
 * @param {number} param.state - Represents the state of the speech recognition engine
 * @param {boolean} param.finished - Value is true, if recognition is finished, otherwise false
 */


/**
 * @function startRecognition
 * @summary Starts the speech recogniztion engine and begins processing
 * @param {object} args - Parameters used to start speech recognition
 * @param {string} [args.type=SOURCE_TYPE_MICROPHONE] - Indicates source for speech recognition (microphone or url)
 * @param {string} [args.url] - Url for audio file to apply speech recognition to.
 * @param {progressCallback} args.progress - Callback function used to report progress of speech recognition
 * @since 1.0.0
 * @returns {boolean} - Returns true if started successfully, otherwise false.
 */
exports.startRecognition = function(args) {
	var progressCallback = args.progress || null;
	var type = args.type;

	if (!type && args.url) {
        type = SOURCE_TYPE_URL;
    } else if (!type) {
        type = SOURCE_TYPE_MICROPHONE;
    }

    if (!progressCallback) {
        Ti.API.error('No "progress" callback supplied - You will not be notified about transcription updates');
    }

    if (recognitionTask) {
        recognitionTask.cancel();
        recognitionTask = null;
        // Can't delete local variable in strict mode
        // delete recognitionTask;
    }

    if (request) {
        request = null;
    }

    if (type == SOURCE_TYPE_URL) {
        var url = args.url.split('.');
        var ext = url.pop();
        var soundPath = NSBundle.mainBundle.pathForResourceOfType(url.join('.'), ext);
        var soundURL = NSURL.fileURLWithPath(soundPath);

        request = SFSpeechURLRecognitionRequest.alloc().initWithURL(soundURL);
        if (!request) {
            console.error('Unable to created a SFSpeechURLRecognitionRequest object');
            return false;
        }

        request.shouldReportPartialResults = true;

        if (!speechRecognizer) {
            exports.initialize();
        }

        recognitionTask = speechRecognizer.recognitionTaskWithRequestResultHandler(request, function(result, error) {

            if (!recognitionTask) {
                // The recognitionTask has already been cancelled.
                return;
            }

            if (recognitionTask.state === Speech.SFSpeechRecognitionTaskStateCanceling) {
                // The recognitionTask is being cancelled so no progress should be reported after this.
                console.info('The speech recognition task has been cancelled.');
                progressCallback &&
                    progressCallback({
                        error: error,
                        value: result && result.bestTranscription.formattedString,
                        state: recognitionTask.state,
                        finished: true,
                    });

                progressCallback = null;
                request = null;
                recognitionTask = null;
                return;
            }

            progressCallback &&
                progressCallback({
                    error: error,
                    value: result && result.bestTranscription.formattedString,
                    state: recognitionTask.state,
                    finished: result && result.isFinal(),
                });

            if (error || (result && result.isFinal())) {
                recognitionTask = null;
                request = null;
                return;
            }
        });

        return true;
    } else if (type == SOURCE_TYPE_MICROPHONE) {

        if (!audioEngine) {
            audioEngine = new AVAudioEngine();
        }

        if (!audioEngine.inputNode) {
            console.error('Audio engine has no input node');
            return false;
        }

        request = new SFSpeechAudioBufferRecognitionRequest();
        request.shouldReportPartialResults = true;

        // Create recognition task that will listen to live speech and send progress to callback
        recognitionTask = speechRecognizer.recognitionTaskWithRequestResultHandler(request, function(result, error) {

            progressCallback({
                error: error,
                value: result && result.bestTranscription.formattedString,
                state: recognitionTask.state,
                finished: result && result.isFinal(),
            });

            if (error || (result && result.isFinal())) {
                if (audioEngine.isRunning()) {
                    audioEngine.stop();
                }
                if (request) {
                    request.endAudio();
                }
                audioEngine.inputNode.removeTapOnBus(0);
                recognitionTask = null;
                request = null;

                return;
            }
        });

        audioEngine.inputNode.installTapOnBusBufferSizeFormatBlock(0, 1024, audioEngine.inputNode.outputFormatForBus(0), function(buffer, when) {
            request && request.appendAudioPCMBuffer(buffer);
        });

        audioEngine.prepare();
        var audioEngineStartError = new NSError();
        var audioEngineStartSuccess = audioEngine.startAndReturnError(audioEngineStartError);
        if (!audioEngineStartSuccess) {
            //TODO: Do something with audioEngineStartError
            return false;
        }

        return true;
    } else {
        console.error('Unhandled type supplied:' + type);
        return false;
    }
};

/**
 * @function stopRecognition
 * @summary Forces speech recognition components to stop processing
 * @since 1.0.0
 */
exports.stopRecognition = function() {
    if (audioEngine && audioEngine.isRunning()) {
        // if we are using the audioEngine for real-time audio, we need to stop components
        audioEngine.stop();
        request && request.endAudio();
        audioEngine.inputNode.removeTapOnBus(0);
    } else if (recognitionTask) {
        // If are using a file for audio recoginition, we need to cancel the recognition task
        recognitionTask.cancel();
    }
};

exports.SOURCE_TYPE_URL = SOURCE_TYPE_URL;
exports.SOURCE_TYPE_MICROPHONE = SOURCE_TYPE_MICROPHONE;
exports.RECOGNITION_STATE_STARTING = Speech.SFSpeechRecognitionTaskStateStarting;
exports.RECOGNITION_STATE_RUNNING = Speech.SFSpeechRecognitionTaskStateRunning;
exports.RECOGNITION_STATE_FINISHING = Speech.SFSpeechRecognitionTaskStateFinishing;
exports.RECOGNITION_STATE_COMPLETED = Speech.SFSpeechRecognitionTaskStateCompleted;
exports.RECOGNITION_STATE_CANCELING = Speech.SFSpeechRecognitionTaskStateCanceling;
