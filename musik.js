/* Musik hanya boleh mulai SETELAH klik Buka Undangan (#btn_open).
 * Menahan panggilan otomatis window.playAudio() (mis. saat tab dibuka kembali)
 * sebelum undangan dibuka. Klik Buka Undangan tetap memutar lagu seperti biasa.
 */
(function () {
  var opened = false;
  function markOpened(e) {
    var t = e.target;
    if (t && t.closest && t.closest("#btn_open")) opened = true;
  }
  document.addEventListener("click", markOpened, true);
  document.addEventListener("touchstart", markOpened, true);
  document.addEventListener("pointerdown", markOpened, true);

  function guard() {
    if (window.playAudio && !window.playAudio.__amsGuarded) {
      var orig = window.playAudio;
      var wrapped = function () {
        if (!opened) return undefined;
        var s = document.getElementById("song");
        var res = orig.apply(this, arguments);
        if (s && (s.currentTime === 0 || s.currentTime < 10)) {
          try {
            if (s.readyState >= 1) {
              s.currentTime = 10;
            } else {
              s.addEventListener("loadedmetadata", function () {
                try { s.currentTime = 10; } catch (err) {}
              }, { once: true });
            }
          } catch (err) {}
        }
        return res;
      };
      wrapped.__amsGuarded = true;
      window.playAudio = wrapped;
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", guard);
  else guard();
})();
