var TiSpeech = require("ti.speech");
TiSpeech.initialize("en_US");

var win = Ti.UI.createWindow({
    backgroundColor: "#fff"
});

var btn = Ti.UI.createButton({
    title: "Recognize speech",
    top: 100
});

var label = Ti.UI.createLabel({
    top: 200,
    left: 50,
    right: 50,
    height: Ti.UI.SIZE
});

if (!TiSpeech.isSupported()) {
    alert("Speech recognition is not available on this device!");
    btn.setEnabled(false);
}

btn.addEventListener("click", function() {
    TiSpeech.recognize({
        type: TiSpeech.SOURCE_TYPE_URL,
        url: "one_more_thing.mp3",
        progress: function(e) {
            label.setText(label.text + "\n" + String(e.value));
            
            if (e.finished) {
                alert("Finished: " + e.value)
            }
        }
    });
});

win.add(btn);
win.add(label);
win.open();
