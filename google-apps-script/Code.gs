const SHEET_NAME = "Anmeldungen";

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(["ID", "Wochenende", "Tag", "Name", "Erstellt am"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet() {
  const rows = getSheet_().getDataRange().getValues();
  const signups = rows.slice(1).filter(row => row[0]).map(row => ({
    id: String(row[0]),
    weekend_id: String(row[1]),
    day: String(row[2]),
    name: String(row[3]),
    created_at: new Date(row[4]).toISOString()
  }));
  return json_({ signups });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const validWeekends = ["oct-2026", "nov-2026", "dec-2026", "jan-2027", "feb-2027", "mar-2027"];
    const validDays = ["Samstag", "Sonntag"];
    const name = String(body.name || "").trim();
    if (!validWeekends.includes(body.weekendId) || !validDays.includes(body.day) || !name || name.length > 80) {
      return json_({ error: "Ungültige Anmeldung." });
    }

    const createdAt = new Date();
    const signup = {
      id: Utilities.getUuid(), weekend_id: body.weekendId, day: body.day, name, created_at: createdAt.toISOString()
    };
    getSheet_().appendRow([signup.id, signup.weekend_id, signup.day, signup.name, createdAt]);
    return json_({ signup });
  } catch (error) {
    return json_({ error: "Eintragung konnte nicht gespeichert werden." });
  }
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
