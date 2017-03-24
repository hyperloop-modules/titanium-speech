Ti.Speech
---
iOS 10 speech-recognition with Appcelerator Hyperloop.

### Requirements
- [x] Titanium SDK 5.5.0.GA+
- [x] Hyperloop 2.0.0+
- [x] Xcode 8+
- [x] Include the following keys in the plist-section of your tiapp.xml:
```xml
<key>NSSpeechRecognitionUsageDescription</key>
<string>Can we parse your spoken words?</string>

<key>NSMicrophoneUsageDescription</key>
<string>Can we use the microphone for real-time speech recognition?</string>
```

### Usage

#### Getting started using example app
1. Copy example app from here: https://github.com/hyperloop-modules/ti.speech/tree/master/example
2. Import app into your account using `appc new --import`
3. Enable Hyperloop platform services when being asked
4. Run the app with `appc run -p ios -I 10.0`


#### Creating a new app
1. Create a new project with `appc new -p ios`
2. Enable Hyperloop platform services when being asked
3. Copy the `ti.speech` in your project and use code from examples (or example app)
4. Run the app with `appc run -p ios -I 10.0`

### Examples

You can use speech recognition with real-time audio or with pre-recorded media files (audio or video).  See [example file](https://github.com/hyperloop-modules/ti.speech/blob/master/example/app/controllers/index.js) for more details.


#### Recognize from File URL
```js 
var TiSpeech = require("ti.speech");
TiSpeech.initialize("en_US");  // locale is optional

var win = Ti.UI.createWindow({
    backgroundColor: "#fff"
});

var btn = Ti.UI.createButton({
    title: "Recognize pre-recorded speech"
});

if (!TiSpeech.isSupported()) {
    alert("Speech recognition is not available on this device!");
    btn.setEnabled(false);
}

btn.addEventListener("click", function() {
    TiSpeech.recognize({
        type: TiSpeech.SOURCE_TYPE_URL, // optional, as it defaults to this if url is defined
        url: "one_more_thing.mp3",
        progress: function(e) {
            Ti.API.info(e.value);
        }
    });
});

win.add(btn);
win.open();
```

#### Recognize from Audio Input
```js 
var TiSpeech = require("ti.speech");
TiSpeech.initialize("en_US");  // locale is optional

var win = Ti.UI.createWindow({
    backgroundColor: "#fff"
});

var btn = Ti.UI.createButton({
    title: "Recognize real-time speech"
});

if (!TiSpeech.isAvailable()) {
    alert("Speech recognition is not available on this device!");
    btn.setEnabled(false);
}

btn.addEventListener("click", function() {
    TiSpeech.startRecognition({
        type: TiSpeech.SOURCE_TYPE_MICROPHONE, // optional, as it defaults to this if url is undefined		
        progress: function(e) {
            Ti.API.info(e.value);
        }
    });
});

win.add(btn);
win.open();

```

### Author
* Hans Knoechel ([@hansemannnn](https://twitter.com/hansemannnn))
* Brenton House ([@brentonhouse](https://twitter.com/brentonhouse))

### License
Apache 2.0

### Contributing
Code contributions are greatly appreciated, please submit a new [pull request](https://github.com/hyperloop-modules/ti.speech/pull/new/master)!
