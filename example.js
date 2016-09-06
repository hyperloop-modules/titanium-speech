var win = Ti.UI.createWindow({
  backgroundColor : "#fff"
});
var btn = Ti.UI.createButton({
  title : "Recognize speech"
});

btn.addEventListener("click", function() {
  var TiSpeech = require("ti.speech");
  TiSpeech.initialize("en_US");

  if (!TiSpeech.isSupported()) {
    Ti.API.error("Speech recognition is not available on this device!");
    return;
  }

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
