const SHEET_NAME = "Anmeldungen";
const CANCELLATION_SHEET_NAME = "Abmeldungen";

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "ID",
      "Wochenende",
      "Tag",
      "Name",
      "Erstellt am",
      "Kommentar",
      "Typ",
      "Rolle",
    ]);
    sheet.setFrozenRows(1);
  }
  if (sheet.getRange(1, 6).getValue() !== "Kommentar")
    sheet.getRange(1, 6).setValue("Kommentar");
  if (sheet.getRange(1, 7).getValue() !== "Typ")
    sheet.getRange(1, 7).setValue("Typ");
  if (sheet.getRange(1, 8).getValue() !== "Rolle")
    sheet.getRange(1, 8).setValue("Rolle");
  return sheet;
}

function getCancellationSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CANCELLATION_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CANCELLATION_SHEET_NAME);
    sheet.appendRow([
      "Anmelde-ID",
      "Wochenende",
      "Tag",
      "Name",
      "Angefragt am",
      "Status",
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet() {
  const rows = getSheet_().getDataRange().getValues();
  const signups = rows
    .slice(1)
    .filter((row) => row[0])
    .map((row) => ({
      id: String(row[0]),
      weekend_id: String(row[1]),
      day: String(row[2]),
      name: String(row[3]),
      created_at: new Date(row[4]).toISOString(),
      event_type: String(row[6] || "weekend"),
      role: String(row[7] || ""),
    }));
  return json_({ signups });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === "cancellation-request")
      return requestCancellation_(String(body.signupId || ""));
    const validWeekends = [
      "oct-2026",
      "nov-2026",
      "dec-2026",
      "jan-2027",
      "feb-2027",
      "mar-2027",
    ];
    const validDays = ["Samstag", "Sonntag"];
    const validConstructionSlots = [
      "fri-09-evening", "sat-10-morning", "sat-10-evening", "sun-11-morning",
      "sun-11-evening", "wed-14-morning", "wed-14-evening", "thu-15-morning",
      "thu-15-evening", "fri-16-morning", "fri-16-evening", "sat-17-morning",
      "sat-17-evening", "sun-18-morning", "sun-18-evening",
    ];
    const validRoles = ["Verpflegung", "Lead", "Helfer:in"];
    const name = String(body.name || "").trim();
    const comment = String(body.comment || "").trim();
    const eventType = body.eventType === "construction-week" ? "construction-week" : "weekend";
    const validSignup =
      eventType === "construction-week"
        ? body.weekendId === "construction-week" &&
          validConstructionSlots.includes(body.day) &&
          validRoles.includes(body.role)
        : validWeekends.includes(body.weekendId) && validDays.includes(body.day);
    if (
      !validSignup ||
      !name ||
      name.length > 80 ||
      comment.length > 500
    ) {
      return json_({ error: "Ungültige Anmeldung." });
    }

    const createdAt = new Date();
    const signup = {
      id: Utilities.getUuid(),
      weekend_id: body.weekendId,
      day: body.day,
      name,
      created_at: createdAt.toISOString(),
      event_type: eventType,
      role: eventType === "construction-week" ? String(body.role) : "",
    };
    getSheet_().appendRow([
      signup.id,
      signup.weekend_id,
      signup.day,
      signup.name,
      createdAt,
      comment,
      signup.event_type,
      signup.role,
    ]);
    return json_({ signup });
  } catch (error) {
    return json_({ error: "Eintragung konnte nicht gespeichert werden." });
  }
}

function requestCancellation_(signupId) {
  const signups = getSheet_().getDataRange().getValues();
  const signup = signups.slice(1).find((row) => String(row[0]) === signupId);
  if (!signup) return json_({ error: "Anmeldung nicht gefunden." });

  const cancellationSheet = getCancellationSheet_();
  const alreadyRequested = cancellationSheet
    .getDataRange()
    .getValues()
    .slice(1)
    .some(
      (row) => String(row[0]) === signupId && String(row[5]) !== "Erledigt",
    );
  if (!alreadyRequested)
    cancellationSheet.appendRow([
      signup[0],
      signup[1],
      signup[2],
      signup[3],
      new Date(),
      "Offen",
    ]);
  return json_({ requested: true });
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// Einmal nach dem Update manuell ausführen: importConstructionWeek2026().
// Übernimmt die bestehenden Einträge aus dem bisherigen Schichtplan.
function importConstructionWeek2026() {
  const sheet = getSheet_();
  const alreadyImported = sheet
    .getDataRange()
    .getValues()
    .slice(1)
    .some((row) => String(row[1]) === "construction-week");
  if (alreadyImported) return;

  const entries = [
    ["fri-09-evening","Verpflegung","Jana"],["fri-09-evening","Lead","Jonas"],["fri-09-evening","Helfer:in","Resi"],["fri-09-evening","Helfer:in","Konrad"],["fri-09-evening","Helfer:in","Chris/ Ines"],
    ["sat-10-morning","Verpflegung","Jana"],["sat-10-morning","Lead","Jonas"],["sat-10-morning","Helfer:in","wolfgang"],["sat-10-morning","Helfer:in","Ines"],["sat-10-morning","Helfer:in","Konrad"],["sat-10-morning","Helfer:in","David/Miri","tbd"],["sat-10-morning","Helfer:in","Nena/Fredo"],["sat-10-morning","Helfer:in","Hannes"],["sat-10-morning","Helfer:in","Max"],["sat-10-morning","Helfer:in","Benny"],["sat-10-morning","Helfer:in","resi"],
    ["sat-10-evening","Verpflegung","Jana"],["sat-10-evening","Lead","Jonas"],["sat-10-evening","Helfer:in","Chris"],["sat-10-evening","Helfer:in","David/Miri","tbd"],["sat-10-evening","Helfer:in","Nena/Fredo"],["sat-10-evening","Helfer:in","Hannes"],["sat-10-evening","Helfer:in","Max"],["sat-10-evening","Helfer:in","Benny"],
    ["sun-11-morning","Verpflegung","Jana"],["sun-11-morning","Lead","Jonas"],["sun-11-morning","Helfer:in","wolfgang"],["sun-11-morning","Helfer:in","Ines"],["sun-11-morning","Helfer:in","Konrad"],["sun-11-morning","Helfer:in","Lorenz"],
    ["sun-11-evening","Verpflegung","Jana"],["sun-11-evening","Lead","Jonas"],["sun-11-evening","Helfer:in","Chris"],["sun-11-evening","Helfer:in","Lorenz"],
    ["wed-14-morning","Verpflegung","Lena (tbd)"],["wed-14-morning","Lead","Lorenz"],["wed-14-morning","Helfer:in","Franzi"],["wed-14-morning","Helfer:in","Wuff"],["wed-14-morning","Helfer:in","justin","bis 13:45."],
    ["wed-14-evening","Verpflegung","Charli - Abendessen: Linseneintopf"],["wed-14-evening","Lead","Lorenz"],["wed-14-evening","Helfer:in","Andi"],["wed-14-evening","Helfer:in","Resi","(siehe unten)"],["wed-14-evening","Helfer:in","Peter"],["wed-14-evening","Helfer:in","Konrad"],["wed-14-evening","Helfer:in","Sophie"],["wed-14-evening","Helfer:in","Ricarda","nicht ganz sicher"],["wed-14-evening","Helfer:in","Franzi"],
    ["thu-15-morning","Verpflegung","Lena (tbd)"],["thu-15-morning","Lead","Lorenz"],["thu-15-morning","Helfer:in","Franzi"],["thu-15-morning","Helfer:in","Konrad"],["thu-15-morning","Helfer:in","Philipp"],
    ["thu-15-evening","Verpflegung","Charli - Abendessen: Kürbissuppe"],["thu-15-evening","Lead","Lorenz"],["thu-15-evening","Helfer:in","Andi"],["thu-15-evening","Helfer:in","Sarah"],["thu-15-evening","Helfer:in","Resi","(siehe unten)"],["thu-15-evening","Helfer:in","Peter"],["thu-15-evening","Helfer:in","Jonas"],["thu-15-evening","Helfer:in","Franzi"],["thu-15-evening","Helfer:in","Sophie"],["thu-15-evening","Helfer:in","Ricarda","Nicht ganz sicher"],["thu-15-evening","Helfer:in","christof"],
    ["fri-16-morning","Verpflegung","Lena/Jana (tbd)"],["fri-16-morning","Lead","Lorenz"],["fri-16-morning","Helfer:in","Chris"],["fri-16-morning","Helfer:in","Konrad"],["fri-16-morning","Helfer:in","Jonas"],
    ["fri-16-evening","Verpflegung","Jana"],["fri-16-evening","Lead","Lorenz"],["fri-16-evening","Helfer:in","Andi"],["fri-16-evening","Helfer:in","Sarah"],["fri-16-evening","Helfer:in","Resi","(siehe unten)"],["fri-16-evening","Helfer:in","Peter"],["fri-16-evening","Helfer:in","Jonas"],["fri-16-evening","Helfer:in","Ricarda"],
    ["sat-17-morning","Lead","Benny"],["sat-17-morning","Helfer:in","Sarah"],["sat-17-morning","Helfer:in","Chris"],["sat-17-morning","Helfer:in","Ricarda"],["sat-17-morning","Helfer:in","Wuff"],["sat-17-morning","Helfer:in","Jonas"],
    ["sat-17-evening","Verpflegung","Lorenz, Karla - Abendessen: vielleicht Pizza"],["sat-17-evening","Lead","Benny"],["sat-17-evening","Helfer:in","Ines"],["sat-17-evening","Helfer:in","Denise"],["sat-17-evening","Helfer:in","Jonas"],
    ["sun-18-morning","Lead","Lorenz"],["sun-18-morning","Helfer:in","Sarah"],["sun-18-morning","Helfer:in","Benny"],["sun-18-morning","Helfer:in","Jonas"],
    ["sun-18-evening","Verpflegung","Charli - Abendessen: irgendwas indisches"],["sun-18-evening","Lead","Jonas"],["sun-18-evening","Helfer:in","Benny"],
  ];
  const now = new Date();
  const rows = entries.map(([slot, role, name, comment]) => [
    Utilities.getUuid(), "construction-week", slot, name, now, comment || "",
    "construction-week", role,
  ]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}
