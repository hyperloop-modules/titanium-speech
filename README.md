Ti.Speech
---
(Experimental) iOS 10 speech-recognition example with Appcelerator Hyperloop.

### Requirements
- [x] Titanium SDK 5.5.0.GA+
- [x] Hyperloop 1.2.7+
- [x] Xcode 8+
- [x] Include the following key in the plist-section of your tiapp.xml:
```xml
<key>NSSpeechRecognitionUsageDescription</key>
<string>Can we parse your spoken words?</string>
```

### Usage
1. Create a new project with `appc new -p ios`
2. Enable Hyperloop platform services when being asked
3. Copy the `ti.speech` in your project and copy the contents of the `example.js`
4. Run the app with `appc run -p ios -I 10.0`

### Example
```js 
var TiSpeech = require("ti.speech");
TiSpeech.initialize("en_US");

var win = Ti.UI.createWindow({
    backgroundColor: "#fff"
});

var btn = Ti.UI.createButton({
    title: "Recognize speech"
});

if (!TiSpeech.isSupported()) {
    alert("Speech recognition is not available on this device!");
    btn.setEnabled(false);
}

btn.addEventListener("click", function() {
    TiSpeech.recognize({
        type: TiSpeech.SOURCE_TYPE_URL, // Currently only audio-files are supported
        url: "one_more_thing.mp3",
        progress: function(e) {
            Ti.API.info(e.value);
        }
    });
});

win.add(btn);
win.open();
```


Author
---------------
Hans Knoechel ([@hansemannnn](https://twitter.com/hansemannnn) / [Web](http://hans-knoechel.de))

License
---------------
Apache 2.0

Contributing
---------------
Code contributions are greatly appreciated, please submit a new [pull request](https://github.com/hansemannn/ti.speech/pull/new/master)!
