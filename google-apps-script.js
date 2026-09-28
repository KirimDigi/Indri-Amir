/**
 * GOOGLE APPS SCRIPT - BUKU TAMU & UCAPAN (RSVP) INDRI & AMIR
 * 
 * ID Spreadsheet: 1YWEdIYptXa8Q8CpMXs0XkF6kf5lwptEqlne-PQTT6nI
 * Nama Sheet    : Sheet1
 * 
 * Kolom yang digunakan:
 * 1. Timestamp
 * 2. Nama Tamu
 * 3. Ucapan
 * 4. Konfirmasi Kehadiran
 * 5. Jumlah Tamu
 * 
 * CARA DEPLOY:
 * 1. Buka spreadsheet Anda: https://docs.google.com/spreadsheets/d/1YWEdIYptXa8Q8CpMXs0XkF6kf5lwptEqlne-PQTT6nI/edit
 * 2. Klik menu 'Extensions' (Ekstensi) > 'Apps Script'.
 * 3. Hapus semua kode yang ada di editor Apps Script, lalu salin dan tempel SELURUH KODE di bawah ini.
 * 4. Simpan proyek (ikon disket / Ctrl+S).
 * 5. Klik tombol biru 'Deploy' (Terapkan) di kanan atas > 'New deployment' (Penerapan baru).
 * 6. Klik ikon gerigi (Select type) > pilih 'Web app' (Aplikasi web).
 * 7. Isi konfigurasi:
 *    - Description: RSVP Indri & Amir
 *    - Execute as  : Me (email akun Google Anda)
 *    - Who has access: Anyone (Siapa saja)  <-- WAJIB pilih Anyone agar bisa diakses oleh website undangan
 * 8. Klik 'Deploy'. Berikan izin otorisasi (Authorize access) jika diminta.
 * 9. Salin 'Web App URL' yang berakhiran /exec.
 * 10. Buka file 'rsvp-sheet.js' di project undangan, lalu tempel URL tersebut di baris 8 pada variabel RSVP_SHEET_URL:
 *     const RSVP_SHEET_URL = "URL_APPS_SCRIPT_ANDA_DI_SINI";
 */

var SPREADSHEET_ID = "1YWEdIYptXa8Q8CpMXs0XkF6kf5lwptEqlne-PQTT6nI";
var SHEET_NAME = "Sheet1";

function doGet(e) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return responseJSON({
        status: "success",
        ok: true,
        data: []
      });
    }
    
    // Ambil data dari baris ke-2 hingga baris terakhir (kolom 1 s/d 5)
    var values = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    var list = [];
    
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var rawTimestamp = row[0];
      var nama = row[1];
      var ucapan = row[2];
      var konfirmasi = row[3];
      var jumlah = row[4];
      
      // Lewati baris yang kosong
      if (!nama && !ucapan) continue;
      
      var tsFormatted = "";
      if (rawTimestamp instanceof Date) {
        tsFormatted = rawTimestamp.toISOString();
      } else if (rawTimestamp) {
        tsFormatted = String(rawTimestamp);
      }
      
      var kehadiran = (String(konfirmasi).toLowerCase() === "hadir" || String(konfirmasi).toLowerCase() === "present") ? "present" : "notpresent";
      
      list.push({
        timestamp: tsFormatted,
        nama: String(nama || ""),
        ucapan: String(ucapan || ""),
        konfirmasi: String(konfirmasi || "Hadir"),
        kehadiran: kehadiran,
        jumlah: jumlah || 1,
        tamu: jumlah || 1
      });
    }
    
    // Urutkan data terbaru di paling atas
    list.reverse();
    
    return responseJSON({
      status: "success",
      ok: true,
      data: list
    });
  } catch (err) {
    return responseJSON({
      status: "error",
      ok: false,
      message: err.toString(),
      data: []
    });
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }
    
    // Buat baris header otomatis jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Nama Tamu", "Ucapan", "Konfirmasi Kehadiran", "Jumlah Tamu"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
    }
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (ex) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    var now = new Date();
    var timestampStr = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    
    var nama = (data.nama || data.author || "").toString().trim();
    var ucapan = (data.ucapan || data.comment || "").toString().trim();
    var konfirmasi = (data.konfirmasi || (data.kehadiran === "present" ? "Hadir" : "Tidak Hadir")).toString().trim();
    var jumlah = parseInt(data.jumlah || data.tamu || data.guest || 1, 10) || 1;
    
    if (!nama && !ucapan) {
      return responseJSON({
        status: "error",
        ok: false,
        message: "Nama atau ucapan tidak boleh kosong"
      });
    }
    
    // Tulis ke spreadsheet sesuai 5 kolom yang ditentukan
    sheet.appendRow([timestampStr, nama, ucapan, konfirmasi, jumlah]);
    
    return responseJSON({
      status: "success",
      ok: true,
      message: "Ucapan berhasil disimpan"
    });
  } catch (err) {
    return responseJSON({
      status: "error",
      ok: false,
      message: err.toString()
    });
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
