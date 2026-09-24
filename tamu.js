/* Personalisasi nama tamu dari link: .../#to=Nama+Tamu (atau ?to=...)
 * Contoh: http://127.0.0.1:5500/index.html#to=Kamu%20%26%20Dia
 * -> tulisan "Tamu Undangan" (cover + bagian QR) otomatis jadi "Kamu & Dia"
 * -> kolom Nama di form ucapan ikut terisi otomatis.
 */
(function () {
  function getGuestName() {
    var raw = "";
    if (location.hash) {
      var h = location.hash;
      var toIdx = h.indexOf("to=");
      if (toIdx !== -1) {
        var sub = h.substring(toIdx + 3);
        var nextParam = sub.search(/&[a-zA-Z0-9_-]+=/);
        raw = (nextParam !== -1) ? sub.substring(0, nextParam) : sub;
      }
    }
    if (!raw && location.search) {
      var s = location.search;
      var toIdxS = s.indexOf("to=");
      if (toIdxS !== -1) {
        var subS = s.substring(toIdxS + 3);
        var nextParamS = subS.search(/&[a-zA-Z0-9_-]+=/);
        raw = (nextParamS !== -1) ? subS.substring(0, nextParamS) : subS;
      }
    }
    if (!raw) return "";
    try {
      return decodeURIComponent(raw.replace(/\+/g, " ")).trim();
    } catch (e) {
      try {
        return decodeURI(raw.replace(/\+/g, " ")).trim();
      } catch (e2) {
        return raw.replace(/\+/g, " ").trim();
      }
    }
  }

  function apply() {
    var nama = getGuestName();
    if (!nama) return;
    document.querySelectorAll(
      '[data-id="d97ae05"] .elementor-heading-title, [data-id="a10a974"] .elementor-heading-title'
    ).forEach(function (el) {
      el.textContent = nama;
    });
    var author = document.querySelector('#commentform-6854 input[name="author"]');
    if (author && !author.value) author.value = nama;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
  window.addEventListener("load", apply);
  window.addEventListener("hashchange", apply);

  // Interval proteksi untuk memastikan Elementor render selesai
  var count = 0;
  var interval = setInterval(function () {
    apply();
    if (++count >= 10) clearInterval(interval);
  }, 200);
})();

