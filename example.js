var win = Ti.UI.createWindow({
    backgroundColor: "#fff"
});
var btn = Ti.UI.createButton({
    title: "Recognize speech"
});

var TiSpeech = require("ti.speech");
TiSpeech.initialize("en_US");

if (!TiSpeech.isSupported()) {
    alert("Speech recognition is not available on this device!");
    btn.setEnabled(false);
}

btn.addEventListener("click", function() {
    TiSpeech.recognize({
        type: TiSpeech.SOURCE_TYPE_URL,
        url: "one_more_thing.mp3",
        progress: function(e) {
            Ti.API.info(e.value);
        }
    });
});

win.add(btn);
win.open();
