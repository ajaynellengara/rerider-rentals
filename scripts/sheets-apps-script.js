/**
 * ReRider Rentals — Google Sheets Operations Sync Script
 * 
 * Instructions:
 * 1. Open your Google Sheet (e.g. "ReRider Rentals — Operations Hub").
 * 2. Click Extensions > Apps Script.
 * 3. Delete any default code and paste this entire script.
 * 4. Update the CONFIG object below with your deployed website URL and SHEETS_WEBHOOK_SECRET.
 * 5. Save the project and click "Run > setupSheetHeaders" once to generate the column headers.
 * 6. Set up an installable trigger: Click "Triggers" (alarm clock icon on left) > "Add Trigger" >
 *    Choose function: "onEditTrigger" > Event source: "From spreadsheet" > Event type: "On edit" > Save.
 */

var CONFIG = {
  // Your Next.js deployed API endpoint (e.g. https://your-domain.vercel.app/api/webhooks/sheets)
  WEBHOOK_URL: 'https://your-domain.com/api/webhooks/sheets',
  
  // Must match the SHEETS_WEBHOOK_SECRET set in your .env
  WEBHOOK_SECRET: 'YOUR_SHEETS_WEBHOOK_SECRET',
  
  // Name of the tab managing rental requests
  TAB_NAME: 'Booking Requests'
};

/**
 * Setup default headers and dropdown validations on the sheet
 */
function setupSheetHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TAB_NAME) || ss.insertSheet(CONFIG.TAB_NAME);
  
  var headers = [
    'Timestamp',
    'Booking Number',
    'Rider Name',
    'Phone',
    'Package',
    'Rental Dates',
    'Total Rent (₹)',
    'Token (₹)',
    'Deposit (₹)',
    'Owner Action',
    'Token Paid',
    'Rent Balance Paid',
    'Deposit Paid',
    'Handover KM',
    'Return KM',
    'Sync Status'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#282c3f').setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  // Set dropdowns for operational control columns
  var actionRule = SpreadsheetApp.newDataValidation().requireValueInList(['PENDING', 'APPROVE', 'DECLINE'], true).build();
  sheet.getRange('J2:J500').setDataValidation(actionRule);

  var yesNoRule = SpreadsheetApp.newDataValidation().requireValueInList(['NO', 'YES'], true).build();
  sheet.getRange('K2:K500').setDataValidation(yesNoRule);
  sheet.getRange('L2:L500').setDataValidation(yesNoRule);
  sheet.getRange('M2:M500').setDataValidation(yesNoRule);

  SpreadsheetApp.getUi().alert('ReRider Rentals headers and dropdowns initialized successfully!');
}

/**
 * Real-time onEdit handler triggered whenever the owner edits a cell in Google Sheets
 */
function onEditTrigger(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.TAB_NAME) return;
  
  var row = e.range.getRow();
  if (row === 1) return; // Ignore header row
  
  var bookingNumber = sheet.getRange(row, 2).getValue();
  if (!bookingNumber || bookingNumber.toString().trim() === '') return;

  var ownerAction = sheet.getRange(row, 10).getValue();
  var tokenPaid = sheet.getRange(row, 11).getValue();
  var rentBalancePaid = sheet.getRange(row, 12).getValue();
  var depositPaid = sheet.getRange(row, 13).getValue();
  var handoverKm = sheet.getRange(row, 14).getValue();
  var returnKm = sheet.getRange(row, 15).getValue();

  var payload = {
    bookingNumber: bookingNumber.toString().trim(),
    action: (ownerAction === 'APPROVE' || ownerAction === 'DECLINE') ? ownerAction : undefined,
    tokenPaid: tokenPaid === 'YES',
    rentalBalancePaid: rentBalancePaid === 'YES',
    depositPaid: depositPaid === 'YES',
    startingOdometer: handoverKm && !isNaN(handoverKm) ? Number(handoverKm) : undefined,
    returnOdometer: returnKm && !isNaN(returnKm) ? Number(returnKm) : undefined,
    fuelPercentage: returnKm ? 100 : undefined
  };

  sendWebhook(payload, row, sheet);
}

/**
 * Send signed HMAC-SHA256 payload to Next.js API
 */
function sendWebhook(payload, row, sheet) {
  var rawBody = JSON.stringify(payload);
  var signature = computeHmacSha256Hex(rawBody, CONFIG.WEBHOOK_SECRET);
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-sheets-signature': signature
    },
    payload: rawBody,
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, options);
    var code = response.getResponseCode();
    var responseBody = response.getContentText();
    
    if (code === 200) {
      sheet.getRange(row, 16).setValue('Synced: ' + new Date().toLocaleTimeString()).setFontColor('#16a34a');
    } else {
      sheet.getRange(row, 16).setValue('Error (' + code + '): ' + responseBody).setFontColor('#dc2626');
    }
  } catch (error) {
    sheet.getRange(row, 16).setValue('Failed: ' + error.toString()).setFontColor('#dc2626');
  }
}

/**
 * Computes hexadecimal HMAC-SHA256 signature
 */
function computeHmacSha256Hex(message, key) {
  var rawBytes = Utilities.computeHmacSha256Signature(message, key);
  var hex = '';
  for (var i = 0; i < rawBytes.length; i++) {
    var byteVal = rawBytes[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length === 1) hex += '0';
    hex += byteHex;
  }
  return hex;
}
