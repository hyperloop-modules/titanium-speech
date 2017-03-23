'use strict';
/***
 * @file Use Speech Recognition functionality in iOS 10
 * @module hyperloop-speech-ios
 * @author Hans Knöchel <hknoechel@appcelerator.com>
 * @author Brenton House <brenton.house@gmail.com>
 * @version 1.0.0
 * @since 1.0.0
 */

var AVAudioEngine = require( 'AVFoundation/AVAudioEngine' );
var AVAudioSession = require( 'AVFoundation/AVAudioSession' );
var AVFoundation = require( 'AVFoundation' );
var NSBundle = require( 'Foundation/NSBundle' );
var NSError = require( 'Foundation/NSError' );
var NSLocale = require( 'Foundation/NSLocale' );
var NSURL = require( 'Foundation/NSURL' );
var SFSpeechAudioBufferRecognitionRequest = require( 'Speech/SFSpeechAudioBufferRecognitionRequest' );
var SFSpeechRecognitionRequest = require( 'Speech/SFSpeechRecognitionRequest' );
var SFSpeechRecognitionResult = require( 'Speech/SFSpeechRecognitionResult' );
var SFSpeechRecognitionTask = require( 'Speech/SFSpeechRecognitionTask' );
var SFSpeechRecognizer = require( 'Speech/SFSpeechRecognizer' );
var SFSpeechURLRecognitionRequest = require( 'Speech/SFSpeechURLRecognitionRequest' );
var Speech = require( 'Speech' );

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
exports.initialize = function ( locale ) {
	if ( speechRecognizer ) {
		speechRecognizer = null;
		// Can't delete local variable in strict mode
		// delete speechRecognizer;
	}

	if ( locale ) {
		speechRecognizer = SFSpeechRecognizer.alloc().initWithLocale( NSLocale.alloc().initWithLocaleIdentifier( locale ) );
	} else {
		speechRecognizer = new SFSpeechRecognizer();
	}
};

/**
 * @function requestSpeechRecognizerAuthorization
 * @summary Asks the user to grant your app permission to perform speech recognition.
 * @param {function} callback - A function that is called when the authorization request has been approved or denied. 
 * @since 1.0.0
 */
exports.requestAuthorization = function ( callback ) {
	SFSpeechRecognizer.requestAuthorization( function ( status ) {
		var success = false;
		var message = '';

		//TODO:  Find out if this is fixed after Hyperloop 2.0.1 is released.
		switch ( status ) {
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
				// Should not be here.  Issue should be solved in Hyperloop 2.0.1.
				message = 'Something has gone wrong when determining Speech Recogniction authorization';
				break;
		}

		//TODO:  Until Hyperloop 2.0.1, setting success = true.
		success = true;

		callback( {
			success: success,
			message: message,
			status: status,
		} );
	} );
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
exports.isAvailable = function () {
	return speechRecognizer && speechRecognizer.isAvailable();
};

/**
 * @function startListening
 * @summary Starts the speech recogniztion engine and begins listening
 * @param {object} args - Parameters used to start speech recognition
 * @param {string} [args.type=SOURCE_TYPE_MICROPHONE] - Indicates source for speech recognition (microphone or url)
 * @param {string} [args.url] - Url for audio file to apply speech recognition to.
 * @param {function} [args.progress] - Callback function used to report progress of speech recognition
 * @since 1.0.0
 * @returns {boolean} - Returns true if started successfully, otherwise false.
 */
exports.startListening = function ( args ) {
	var type = args.type;
	if ( !type && args.url ) {
		type = SOURCE_TYPE_URL;
	} else if ( !type ) {
		type = SOURCE_TYPE_MICROPHONE;
	}
	var progressCallback = args.progress || null;

	if ( !progressCallback ) {
		Ti.API.error( 'No "progress" callback supplied - You will not be notified about transcription updates' );
	}

	if ( recognitionTask ) {
		recognitionTask.cancel();
		recognitionTask = null;
		// Can't delete local variable in strict mode
		// delete recognitionTask;
	}

	if( request ){
		request = null;
	}

	if ( type == SOURCE_TYPE_URL ) {
		var url = args.url.split( '.' ); // Keep it for now: Split into filename and extension
		var soundPath = NSBundle.mainBundle.pathForResourceOfType( url[ 0 ], url[ 1 ] );
		var soundURL = NSURL.fileURLWithPath( soundPath );

		request = SFSpeechURLRecognitionRequest.alloc().initWithURL( soundURL );
		if ( !request ) {
			console.error( 'Unable to created a SFSpeechURLRecognitionRequest object' );
			return false;
		}

		request.shouldReportPartialResults = true;

		if ( !speechRecognizer ) {
			exports.initialize();
		}

		recognitionTask = speechRecognizer.recognitionTaskWithRequestResultHandler( request, function ( result, error ) {

			if ( !recognitionTask ) {
				// The recognitionTask has already been cancelled.
				return;
			}

			if ( recognitionTask.state === Speech.SFSpeechRecognitionTaskStateCanceling ) {
				// The recognitionTask is being cancelled so no progress should be reported after this.
				console.info( 'The speech recognition task has been cancelled.' );
				progressCallback &&
					progressCallback( {
						error: error,
						value: result && result.bestTranscription.formattedString,
						state: recognitionTask.state,
						finished: true,
					} );

				progressCallback = null;
				request = null;
				recognitionTask = null;
				return;
			}

			progressCallback &&
				progressCallback( {
					error: error,
					value: result && result.bestTranscription.formattedString,
					state: recognitionTask.state,
					finished: result && result.isFinal(),
				} );

			if ( error || ( result && result.isFinal() ) ) {
				recognitionTask = null;
				request = null;
				return;
			}
		} );

		return true;


	} else if ( type == SOURCE_TYPE_MICROPHONE ) {

		if ( !audioEngine ) {
			audioEngine = new AVAudioEngine();
		}

		if ( !audioEngine.inputNode ) {
			console.error( 'Audio engine has no input node' );
			return false;
		}

		request = new SFSpeechAudioBufferRecognitionRequest();
		request.shouldReportPartialResults = true;

		// Create recognition task that will listen to live speech and send progress to callback
		recognitionTask = speechRecognizer.recognitionTaskWithRequestResultHandler( request, function ( result, error ) {
			progressCallback( {
				error: error,
				value: result && result.bestTranscription.formattedString,
				state: recognitionTask.state,
				finished: result && result.isFinal(),
			} );

			if ( error || ( result && result.isFinal() ) ) {
				if ( audioEngine.isRunning() ) {
					audioEngine.stop();
				}
				if ( request ) {
					request.endAudio();
				}
				audioEngine.inputNode.removeTapOnBus( 0 );
				recognitionTask = null;
				request = null;

				return;
			}
		} );

		audioEngine.inputNode.installTapOnBusBufferSizeFormatBlock( 0, 1024, audioEngine.inputNode.outputFormatForBus( 0 ), function ( buffer, when ) {
			request.appendAudioPCMBuffer( buffer );
		} );

		audioEngine.prepare();
		var audioEngineStartError = new NSError();
		var audioEngineStartSuccess = audioEngine.startAndReturnError( audioEngineStartError );
		if ( !audioEngineStartSuccess ) {
			//TODO: Do something with audioEngineStartError
			return false;
		}

		return true;
	} else {
		console.error( 'Unhandled type supplied:' + type );
		return false;
	}
};

/**
 * @function stopListening
 * @summary Forces speech recognition components to stop listening
 * @since 1.0.0
 */
exports.stopListening = function () {
	if ( audioEngine && audioEngine.isRunning() ) {
		audioEngine.stop();
		request && request.endAudio();
		audioEngine.inputNode.removeTapOnBus( 0 );
	}
	// recognitionTask && recognitionTask.finish();
	// recognitionTask && recognitionTask.cancel();

	if ( recognitionTask ) {
		console.warn( 'you are here → recognitionTask.finish()' );
		// recognitionTask.finish();
		recognitionTask.cancel();
	}

};

exports.SOURCE_TYPE_URL = SOURCE_TYPE_URL;
exports.SOURCE_TYPE_MICROPHONE = SOURCE_TYPE_MICROPHONE;
exports.RECOGNITION_STATE_CANCELING = Speech.SFSpeechRecognitionTaskStateStarting;
exports.RECOGNITION_STATE_RUNNING = Speech.SFSpeechRecognitionTaskStateRunning;
exports.RECOGNITION_STATE_FINISHING = Speech.SFSpeechRecognitionTaskStateFinishing;
exports.RECOGNITION_STATE_COMPLETED = Speech.SFSpeechRecognitionTaskStateCompleted;
exports.RECOGNITION_STATE_CANCELING = Speech.SFSpeechRecognitionTaskStateCanceling;