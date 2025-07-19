package genem;

import js.html.Audio;

class AudioPMP {
  public static function playsound(url:String):Void {
    var sound = new Audio(url);
    sound.play();
  }
}