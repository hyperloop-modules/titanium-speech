var TiSpeech = require( 'ti.speech' );
TiSpeech.initialize();

if ( !TiSpeech.isAvailable() ) {
	alert( 'Speech recognition is not available on this device!' );
	$.toggleLiveRecognitionButton.setEnabled( false );
	$.toggleAudioRecognitionButton.setEnabled( false );
	$.toggleVideoRecognitionButton.setEnabled( false );
} else {
	TiSpeech.requestAuthorization( function ( e ) {
		if ( !e.success ) {
			alert( "Speech recognition was not authorized!" );
			$.toggleLiveRecognitionButton.setEnabled( false );
			$.toggleAudioRecognitionButton.setEnabled( false );
			$.toggleVideoRecognitionButton.setEnabled( false );
		}
	} );
}

var isRunning = false;

/**
 * @function stopRecognition
 * @summary Stops voice recognition and resets buttons
 * @since 1.0.0
 */
function stopRecognition() {

	if ( isRunning ) {
		TiSpeech.stopRecognition();
	}

	isRunning = false;

	$.toggleLiveRecognitionButton.title = 'Start Listening to Live Audio';
	$.toggleAudioRecognitionButton.title = 'Start Listening to Audio File';
	$.toggleVideoRecognitionButton.title = 'Start Listening to Video File';

	$.toggleLiveRecognitionButton.setEnabled( true );
	$.toggleAudioRecognitionButton.setEnabled( true );
	$.toggleVideoRecognitionButton.setEnabled( true );
}

/**
 * @function progressCallback
 * @summary Function used to report progress of speech recognition
 * @param {object} e - Resulting progress object
 * @param {boolean} e.finished - Indicates if the speech recognition has completed
 * @param {object} e.error - If an error occurred, this parameter will contain the error information
 * @param {string} e.value - Transcript of the recognized speech
 * @since 1.0.0
 */
function progressCallback( e ) {
	if ( e.error ) {
		console.error( 'An error occurred with speech recognition' );
		console.error( e.error );
		if ( e.error.toString().match( /Timeout/g ) ) {
			alert( 'Time limit exceeded for speech recognition' );
		} else {
			alert( 'An error occurred with speech recognition' );
		}
		stopRecognition();
		return;
	} else {
		$.results.setText( e.value );
	}
	if ( e.finished ) {
		isRunning = false;
		stopRecognition();
	}
}

function toggleLiveRecognition( e ) {
	TiSpeech.initialize();

	if ( isRunning ) {
		stopRecognition();
	} else {
		$.results.setText( 'Listening...' );

		var success = TiSpeech.startRecognition( {
			progress: progressCallback,
		} );

		if ( success ) {
			isRunning = true;
			$.toggleLiveRecognitionButton.title = 'Stop Listening';
		}
	}
}

function toggleAudioRecognition( e ) {
	// Initializing with locale 'en_US' because audio is in English
	TiSpeech.initialize( 'en_US' );

	if ( isRunning ) {
		stopRecognition();
	} else {

		$.results.setText( 'Loading Audio File...' );
		var success = TiSpeech.startRecognition( {
			type: TiSpeech.SOURCE_TYPE_URL,
			url: 'one_more_thing.mp3',
			progress: progressCallback,
		} );

		if ( success ) {
			isRunning = true;
			$.toggleAudioRecognitionButton.title = 'Stop Listening';
		}
	}
}

function toggleVideoRecognition( e ) {
	TiSpeech.initialize( 'en_GB' );

	if ( isRunning ) {
		stopRecognition();
	} else {
		$.results.setText( 'Loading Video File...' );

		var success = TiSpeech.startRecognition( {
			type: TiSpeech.SOURCE_TYPE_URL,
			url: 'hyperloop.mp4',
			progress: progressCallback,
		} );
		if ( success ) {
			isRunning = true;
			$.toggleVideoRecognitionButton.title = 'Stop Listening';
		}
	}
}

$.index.open();