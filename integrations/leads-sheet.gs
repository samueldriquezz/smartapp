/**
 * SmartApp leads -> Google Sheet.
 * Paste into the EXISTING spreadsheet's Extensions > Apps Script (as a new file if it has scripts already), set the SECRET script property,
 * deploy as a Web app (Execute as: Me, Who has access: Anyone) and put the /exec URL
 * in Vercel as LEADS_SHEET_URL. /api/lead posts every lead here.
 */
// Leads go to their own tab in an existing spreadsheet; the other tabs are never touched.
const TAB = 'לידים מהאתר';
function doPost(e) {
  const out = obj => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  try {
    const b = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!secret || b.secret !== secret) return out({ ok: false, error: 'unauthorized' });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sh = ss.getSheetByName(TAB) || ss.insertSheet(TAB);
      // columns and their order come from /api/lead, so changing them never needs a redeploy here
      if (sh.getLastRow() === 0 && b.headers) {
        sh.appendRow(b.headers);
        sh.getRange(1, 1, 1, b.headers.length).setFontWeight('bold');
        sh.setFrozenRows(1);
        sh.setRightToLeft(true);
      }
      sh.appendRow(b.row);
    } finally {
      lock.releaseLock();
    }
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}
