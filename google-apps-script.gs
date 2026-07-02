/**
 * Brain Dominance Test - Google Sheet writer
 * Paste this into Extensions > Apps Script of your Google Sheet, then Deploy as a Web app.
 * The site POSTs one JSON object per submission; each becomes a row on the "Responses" tab.
 */

var HEADERS = [
  "Timestamp",
  "Name","Position","Branch / Department","Age","Gender","Tenure in the company",
  "Primary","Secondary","Tertiary","Fourth",
  "Analyst Likert %","Analyst FC %","Analyst Combined %",
  "Builder Likert %","Builder FC %","Builder Combined %",
  "Connector Likert %","Connector FC %","Connector Combined %",
  "Dreamer Likert %","Dreamer FC %","Dreamer Combined %",
  "Raw answers (JSON)"
];

function doPost(e){
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Responses");
    if (!sheet) sheet = ss.insertSheet("Responses");
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

    var data = {};
    try { data = JSON.parse(e.postData.contents); } catch (err) {}

    var row = HEADERS.map(function(h){ return (data[h] !== undefined && data[h] !== null) ? data[h] : ""; });
    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ok:true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false, error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(){
  return ContentService.createTextOutput("Brain Dominance Test endpoint is live.");
}
