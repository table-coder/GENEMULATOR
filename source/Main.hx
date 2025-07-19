import genem.PMPAudio;
import js.Browser;
import js.html.Document;

class Main {
    static function main() {
        trace("Hello from Haxe!");
		AudioPMP.playsound("assets/sounds/startup.wav");
        Browser.document.body.style.backgroundColor = "#000000";
    }
}
