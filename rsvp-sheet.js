/* RSVP Ucapan -> Spreadsheet (Google Apps Script) + tampil instan + tanggal/jam
 * Cara pakai:
 * 1. Buat Google Sheet + Apps Script (kode ada di panduan), Deploy as Web App (Anyone).
 * 2. Tempel URL-nya ke RSVP_SHEET_URL di bawah, contoh:
 *    const RSVP_SHEET_URL = "https://script.google.com/macros/s/XXXX/exec";
 * 3. Refresh halaman. Tanpa URL pun ucapan tetap tampil instan (tersimpan di browser).
 */
const RSVP_SHEET_URL = "https://script.google.com/macros/s/AKfycbwW_W2-k-78MkXUic6-XGq2an_Md5lZo03hLOrfxLro1N9Ltw16-QvGMFea5a5dIgBN/exec";
const RSVP_POST_ID = "6854";
const RSVP_STORAGE_KEY = "wishes_indri_amir_v1";
var lastSendKey = "", lastSendAt = 0;
var listOpen = false, ucapanCount = 0;

(function () {
  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fmtTanggal(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso);
      if (!isNaN(d.getTime())) {
        var s = d.toLocaleString("id-ID", {
          day: "numeric", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        });
        return s.replace(".", ":") + " WIB";
      }
      return String(iso);
    } catch (e) { return String(iso); }
  }
  function badge(att) {
    if (att === "present" || att === "Hadir") return '<span class="wds-badge wds-hadir">Hadir</span>';
    if (att === "notpresent" || att === "Tidak Hadir") return '<span class="wds-badge wds-tidak">Tidak Hadir</span>';
    return "";
  }

  // CSS ucapan
  var css = document.createElement("style");
  css.textContent = [
    "#saic-wrap-comment-6854{display:block !important;}",
    "#saic-container-comment-6854{display:none;list-style:none;margin:18px 0 0;padding:0 4px 0 0;max-height:380px;overflow-y:auto;scrollbar-width:thin;-webkit-overflow-scrolling:touch;}",
    "#saic-container-comment-6854.wds-open{display:block;}",
    "#wds-toggle-ucapan{width:100%;margin-top:12px;padding:10px 14px;border-radius:999px;border:1px solid #B09B7B;background:transparent;color:#8a7a63;font-weight:700;font-size:14px;cursor:pointer;}",
    "#wds-toggle-ucapan:hover{background:#B09B7B;color:#fff;}",
    ".wds-ucapan-item{background:#fff;border:1px solid #eadfd2;border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.05);text-align:left;}",
    ".wds-ucapan-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;}",
    ".wds-ucapan-nama{font-weight:700;color:#5b4a3a;font-size:14px;}",
    ".wds-badge{font-size:11px;padding:2px 8px;border-radius:999px;font-weight:700;}",
    ".wds-hadir{background:#e7f6ec;color:#1c7c3e;}",
    ".wds-tidak{background:#fdecea;color:#b3261e;}",
    ".wds-ucapan-waktu{font-size:11px;color:#a08c78;margin-left:auto;}",
    ".wds-ucapan-isi{font-size:14px;color:#333;line-height:1.5;word-wrap:break-word;}",
    ".wds-ucapan-tamu{font-size:11px;color:#a08c78;font-weight:700;white-space:nowrap;}",
    ".wds-spinner{display:inline-block;width:16px;height:16px;border:2.5px solid rgba(176,155,123,0.3);border-radius:50%;border-top-color:#B09B7B;animation:wds-spin .7s linear infinite;vertical-align:middle;margin-right:8px;}",
    "@keyframes wds-spin{to{transform:rotate(360deg);}}",
    ".wds-status-loading{background:#fdfbf8;color:#8a7a63;border:1px solid #eadfd2;padding:10px 14px;border-radius:8px;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;margin-top:10px;}",
    ".saic-ajax-success{background:#e7f6ec;color:#1c7c3e;padding:10px 14px;border-radius:8px;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;}",
    ".saic-ajax-error{background:#fdecea;color:#b3261e;padding:10px 14px;border-radius:8px;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;}",
    ".wds-loading{font-size:13px;color:#a08c78;padding:8px 0;}",
    "#guest{text-align:left !important;text-align-last:left !important;padding:8px 32px 8px 14px !important;box-sizing:border-box !important;}",
    ".saic-wrap-guest select{min-width:0 !important;}"
  ].join("\n");
  document.head.appendChild(css);

  function getList() {
    try { return JSON.parse(localStorage.getItem(RSVP_STORAGE_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function setList(a) {
    try { localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(dedupe(a).slice(0, 200))); } catch (e) {}
  }
  // Hapus ganda: nama+ucapan sama & waktu berdekatan (<10 mnt) dianggap 1 ucapan.
  // (Waktu dari spreadsheet kehilangan milidetik, jadi timestamp persis tak bisa disamakan.)
  function sameUcapan(a, b) {
    if (!a || !b) return false;
    if (String(a.nama || "").trim() !== String(b.nama || "").trim()) return false;
    if (String(a.ucapan || "").trim() !== String(b.ucapan || "").trim()) return false;
    var ta = Date.parse(a.timestamp), tb = Date.parse(b.timestamp);
    if (isNaN(ta) || isNaN(tb)) return true;
    return Math.abs(ta - tb) < 10 * 60 * 1000;
  }
  function dedupe(items) {
    var out = [];
    (items || []).forEach(function (it) {
      var dup = out.some(function (kept) { return sameUcapan(kept, it); });
      if (!dup) out.push(it);
    });
    return out;
  }
  function render(items) {
    var ul = $("#saic-container-comment-" + RSVP_POST_ID);
    if (!ul) return;
    items = dedupe(items);
    if (!items.length) {
      ul.innerHTML = '<li class="wds-loading">Belum ada ucapan. Jadilah yang pertama mengirim doa terbaik.</li>';
      return;
    }
    ul.innerHTML = items.map(function (it) {
      var tamuTxt = "";
      if (it.kehadiran === "present" && parseInt(it.tamu, 10) > 0) {
        tamuTxt = '<span class="wds-ucapan-tamu">' + esc(it.tamu) + " orang</span>";
      }
      return '<li class="wds-ucapan-item">' +
        '<div class="wds-ucapan-head"><span class="wds-ucapan-nama">' + esc(it.nama) + "</span>" +
        badge(it.kehadiran) + tamuTxt +
        '<span class="wds-ucapan-waktu">' + esc(fmtTanggal(it.timestamp)) + "</span></div>" +
        '<div class="wds-ucapan-isi">' + esc(it.ucapan) + "</div></li>";
    }).join("");
    var link = $("#saic-link-" + RSVP_POST_ID + " span");
    if (link) link.textContent = String(items.length);
    ucapanCount = items.length;
    updateToggle();
  }
  function updateToggle() {
    var b = $("#wds-toggle-ucapan");
    if (!b) return;
    b.textContent = (listOpen ? "Sembunyikan Ucapan (" : "Tampilkan Ucapan (") + ucapanCount + ")";
  }

  function showStatus(html, statusType) {
    var st = $("#saic-comment-status-" + RSVP_POST_ID);
    if (!st) return;
    if (statusType === "loading") {
      st.innerHTML = '<div class="wds-status-loading"><span class="wds-spinner"></span><span>' + html + '</span></div>';
      st.style.display = "block";
    } else if (statusType === true || statusType === "success") {
      st.innerHTML = '<div class="saic-ajax-success"><i class="fas fa-check-circle"></i> <span>' + html + '</span></div>';
      st.style.display = "block";
      setTimeout(function () { st.style.display = "none"; }, 5000);
    } else {
      st.innerHTML = '<div class="saic-ajax-error"><i class="fas fa-times-circle"></i> <span>' + html + '</span></div>';
      st.style.display = "block";
      setTimeout(function () { st.style.display = "none"; }, 5000);
    }
  }

  async function loadRemote() {
    if (!RSVP_SHEET_URL) return null;
    try {
      var r = await fetch(RSVP_SHEET_URL + "?action=list", { method: "GET" });
      var j = await r.json();
      if (j && (j.ok || j.status === "success") && Array.isArray(j.data)) {
        return j.data.map(function(item) {
          var kehadiran = item.kehadiran || (item.konfirmasi === "Tidak Hadir" ? "notpresent" : "present");
          return {
            nama: item.nama,
            ucapan: item.ucapan,
            kehadiran: kehadiran,
            tamu: item.tamu || item.jumlah || 1,
            timestamp: item.timestamp,
            synced: true
          };
        });
      }
    } catch (e) {}
    return null;
  }
  async function sendRemote(item) {
    if (!RSVP_SHEET_URL) return false;
    try {
      var konfirmasi = (item.kehadiran === "present" || item.kehadiran === "Hadir") ? "Hadir" : "Tidak Hadir";
      var r = await fetch(RSVP_SHEET_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          nama: item.nama,
          ucapan: item.ucapan,
          konfirmasi: konfirmasi,
          kehadiran: item.kehadiran,
          jumlah: item.tamu || 1,
          tamu: item.tamu || 1,
          timestamp: item.timestamp
        })
      });
      var j = await r.json();
      return !!(j && (j.ok || j.status === "success"));
    } catch (e) { return false; }
  }
  // pending = eksplisit belum sinkron (synced===false). Data lama tanpa flag
  // dianggap sudah sinkron agar tidak terkirim ulang jadi ganda di sheet.
  function isPending(x) { return !!x && x.synced === false; }
  function sameKey(a, b) {
    return a && b && a.timestamp === b.timestamp &&
      String(a.nama || "") === String(b.nama || "") &&
      String(a.ucapan || "") === String(b.ucapan || "");
  }
  function markSynced(item) {
    var cur = getList(), changed = false;
    cur.forEach(function (x) { if (sameKey(x, item) && x.synced !== true) { x.synced = true; changed = true; } });
    if (changed) setList(cur);
  }

  function init() {
    // Bersihkan cache ucapan lama dari tema sebelumnya agar reset total
    try {
      localStorage.removeItem("wishes_6854_v1");
    } catch (e) {}

    // Matikan handler bawaan wds-rsvp.js (ajax ke WordPress lama yang sudah mati)
    try {
      if (window.jQuery) jQuery("body").off("submit", ".saic-container-form form");
    } catch (e) {}
    // Paksa tampil (sistem lama menyembunyikan + gagal ajax ke WordPress)
    var wrap = $("#saic-wrap-comment-" + RSVP_POST_ID);
    if (wrap) wrap.style.display = "block";

    // Tombol Tampilkan/Sembunyikan Ucapan di bawah tombol Kirim
    var formEl = $("#commentform-" + RSVP_POST_ID);
    if (formEl && !$("#wds-toggle-ucapan")) {
      var tg = document.createElement("button");
      tg.type = "button";
      tg.id = "wds-toggle-ucapan";
      var anchor = formEl.querySelector(".saic-wrap-submit");
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(tg, anchor.nextSibling);
      else formEl.appendChild(tg);
      tg.addEventListener("click", function () {
        listOpen = !listOpen;
        var ul = $("#saic-container-comment-" + RSVP_POST_ID);
        if (ul) ul.classList.toggle("wds-open", listOpen);
        updateToggle();
      });
      updateToggle();
    }

    var local = getList();
    render(local);
    loadRemote().then(function (remote) {
      if (!remote) return; // offline: tampilkan salinan lokal apa adanya
      // Spreadsheet = acuan. Kirim ulang yang tertunda, lalu gabung:
      // isi sheet + yang masih tertunda. Yang sudah sinkron tapi tak ada
      // di sheet = sudah dihapus -> ikut hilang dari tampilan.
      var pendings = getList().filter(isPending);
      var justSynced = {};
      var finish = function () {
        var fresh = getList();
        var keep = fresh.filter(function (x) {
          return isPending(x) || justSynced[x.timestamp + "|" + x.nama];
        });
        var merged = dedupe(remote.concat(keep));
        setList(merged);
        render(merged);
      };
      if (!pendings.length) { finish(); return; }
      var n = 0;
      pendings.forEach(function (p) {
        sendRemote(p).then(function (ok) {
          if (ok) { markSynced(p); justSynced[p.timestamp + "|" + p.nama] = 1; }
          if (++n === pendings.length) finish();
        });
      });
    });

    // Cegat submit SEBELUM script bawaan (capture + stopImmediatePropagation)
    document.addEventListener("submit", async function (e) {
      var f = e.target;
      if (!f || !f.id || f.id !== "commentform-" + RSVP_POST_ID) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.stopPropagation) e.stopPropagation();

      var namaEl = f.querySelector('input[name="author"]');
      var ucapEl = f.querySelector('textarea[name="comment"]');
      var attEl = f.querySelector('input[name="attendance"]');
      var guestEl = f.querySelector('select[name="guest"]');
      var nama = (namaEl ? namaEl.value : "").trim().replace(/\s+/g, " ");
      var ucapan = (ucapEl ? ucapEl.value : "").trim();
      var kehadiran = attEl ? attEl.value : "notsure";
      var tamu = guestEl ? guestEl.value : "1";

      if (nama.length < 2) {
        var ne = f.querySelector(".saic-error-info-name");
        if (ne) { ne.style.display = "inline"; setTimeout(function(){ ne.style.display="none"; }, 2500); }
        showStatus("Isi nama dulu ya (minimal 2 huruf).", "error");
        if (namaEl) namaEl.focus();
        return;
      }
      if (ucapan.replace(/\s+/g, " ").length < 2) {
        var te = f.querySelector(".saic-error-info-text");
        if (te) { te.style.display = "inline"; setTimeout(function(){ te.style.display="none"; }, 2500); }
        showStatus("Tulis ucapan dulu ya (minimal 2 karakter).", "error");
        if (ucapEl) ucapEl.focus();
        return;
      }
      if (kehadiran !== "present" && kehadiran !== "notpresent") {
        var ae = f.querySelector(".saic-error-info-attendance");
        if (ae) { ae.style.display = "inline"; setTimeout(function(){ ae.style.display="none"; }, 2500); }
        showStatus("Pilih konfirmasi kehadiran (Hadir / Tidak Hadir) dulu ya.", "error");
        return;
      }

      var btn = f.querySelector('input[type="submit"]');

      // Kunci klik-ganda: abaikan kirim ulang konten sama dalam 3 detik
      var now = Date.now();
      var sendKey = nama + "|" + ucapan;
      if (sendKey === lastSendKey && (now - lastSendAt) < 3000) {
        return;
      }
      lastSendKey = sendKey; lastSendAt = now;

      // 1. Tampilkan status Loading dengan reload spinner
      if (btn) { btn.disabled = true; btn.value = "Mengirim..."; }
      showStatus("Sedang mengirim ucapan & konfirmasi kehadiran...", "loading");

      var item = {
        nama: nama, ucapan: ucapan, kehadiran: kehadiran, tamu: tamu,
        timestamp: new Date().toISOString(), synced: false
      };

      try {
        var isSuccess = await sendRemote(item);
        if (isSuccess) {
          markSynced(item);
          item.synced = true;
          var list = getList();
          list.unshift(item);
          setList(list);
          render(list);

          // 2. Tampilkan notifikasi Berhasil
          showStatus("Terima kasih! Ucapan & konfirmasi kehadiran Anda berhasil terkirim.", "success");
          listOpen = true;
          var ulOpen = $("#saic-container-comment-" + RSVP_POST_ID);
          if (ulOpen) ulOpen.classList.add("wds-open");
          updateToggle();
          if (ucapEl) ucapEl.value = "";

          // Sinkronisasi data terbaru dari spreadsheet
          loadRemote().then(function (remote) {
            if (remote && remote.length) {
              setList(remote);
              render(remote);
            }
          });
        } else {
          // 3. Tampilkan notifikasi Gagal jika server menolak / error
          showStatus("Gagal mengirim ucapan ke spreadsheet. Silakan periksa koneksi internet Anda dan coba lagi.", "error");
        }
      } catch (err) {
        // Tampilkan notifikasi Gagal jika terjadi exception
        showStatus("Terjadi kesalahan koneksi saat mengirim: " + (err.message || "Coba lagi"), "error");
      } finally {
        if (btn) { btn.disabled = false; btn.value = "Kirim"; }
      }
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
