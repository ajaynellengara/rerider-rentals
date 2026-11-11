/**
 * ReRider Rentals — Complete Operations Workbook Setup Script (Google Apps Script)
 * 
 * Instructions:
 * 1. Open your target Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Paste this script and run `setupReRiderWorkbook()`.
 * 4. It will:
 *    - Inspect existing sheets and PRESERVE any existing response tabs untouched.
 *    - Create the 7 required operational tabs (Riders, Packages, Vehicles, Rentals, Payments, Extensions, Handover).
 *    - Apply exact column headers, header styling, row 1 freeze, and column filters.
 *    - Add strict dropdown validations for all status and enum fields.
 *    - Format currency columns with Indian Rupee formatting (₹#,##0.00).
 *    - Add conditional formatting rules to highlight duplicate IDs.
 *    - Seed initial fleet data for the Honda Dio (KL-07-BW-1234) and standard packages.
 */

function setupReRiderWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Inspect existing sheets & log
  var existingSheets = ss.getSheets();
  var existingSheetNames = existingSheets.map(function(s) { return s.getName(); });
  Logger.log("Existing sheets preserved: " + existingSheetNames.join(", "));

  // Definition of the 7 required tabs
  var TABS = {
    Riders: {
      headers: [
        "Rider ID", "Full Name", "Phone", "Email", "Hub",
        "KYC Status", "Account Status", "Created At", "Admin Notes"
      ],
      validations: {
        F: ["PENDING", "VERIFIED", "REJECTED"], // KYC Status
        G: ["PENDING_APPROVAL", "ACTIVE", "DORMANT"] // Account Status
      },
      idCol: "A",
      dateCols: ["H"]
    },
    Packages: {
      headers: [
        "Package ID", "Package Name", "Duration Days", "Daily Rate INR",
        "Booking Token INR", "Security Deposit INR", "Active", "Admin Notes"
      ],
      validations: {
        G: ["YES", "NO"] // Active
      },
      idCol: "A",
      currencyCols: ["D", "E", "F"],
      initialData: [
        ["PKG-001", "14-Day Commercial Standard", 14, 450, 1000, 4000, "YES", "Standard gig delivery package (Swiggy/Zomato)"],
        ["PKG-002", "26-Day Monthly Package", 26, 400, 1000, 4000, "YES", "Monthly commuter package"]
      ]
    },
    Vehicles: {
      headers: [
        "Vehicle ID", "Registration Number", "Manufacturer", "Model",
        "Year", "Category", "Vehicle Status", "Hub"
      ],
      validations: {
        F: ["SCOOTER", "BIKE"], // Category
        G: ["AVAILABLE", "ASSIGNED", "MAINTENANCE"] // Vehicle Status
      },
      idCol: "A",
      initialData: [
        ["VEH-001", "KL-07-BW-1234", "Honda", "Dio 110cc Deluxe", 2022, "SCOOTER", "AVAILABLE", "Kochi Central Hub"]
      ]
    },
    Rentals: {
      headers: [
        "Rental ID", "Booking Number", "Rider ID", "Package ID", "Vehicle ID",
        "Request Date", "Start Date", "Expected Return Date", "Rental Status",
        "Package Name Snapshot", "Duration Days Snapshot", "Daily Rate Snapshot INR",
        "Token Snapshot INR", "Deposit Snapshot INR", "Total Rent INR", "Admin Notes"
      ],
      validations: {
        I: ["PENDING", "APPROVED", "ACTIVE", "COMPLETED", "CANCELLED"] // Rental Status
      },
      idCol: "A",
      dateCols: ["F", "G", "H"],
      currencyCols: ["L", "M", "N", "O"]
    },
    Payments: {
      headers: [
        "Payment ID", "Rental ID", "Payment Type", "Amount INR",
        "Payment Status", "Payment Method", "Reference Number", "Paid At", "Recorded By"
      ],
      validations: {
        C: ["TOKEN", "RENT", "SECURITY_DEPOSIT", "EXTENSION_RENT", "REFUND"], // Payment Type
        E: ["PENDING", "PAID", "FAILED", "REFUNDED"], // Payment Status
        F: ["CASH", "UPI", "BANK_TRANSFER", "OTHER"] // Payment Method
      },
      idCol: "A",
      currencyCols: ["D"],
      dateCols: ["H"]
    },
    Extensions: {
      headers: [
        "Extension ID", "Rental ID", "Requested At", "Extra Days",
        "Old Return Date", "Proposed Return Date", "Additional Rent INR",
        "Extension Status", "Reviewed By", "Reviewed At"
      ],
      validations: {
        H: ["PENDING", "APPROVED", "REJECTED"] // Extension Status
      },
      idCol: "A",
      dateCols: ["C", "E", "F", "J"],
      currencyCols: ["G"]
    },
    Handover: {
      headers: [
        "Handover ID", "Rental ID", "Handed Over At", "Odometer KM",
        "Fuel Level Percent", "Condition Notes", "Front Photo URL",
        "Rear Photo URL", "Left Photo URL", "Right Photo URL", "Recorded By"
      ],
      idCol: "A",
      dateCols: ["C"]
    }
  };

  // 2. Iterate and setup each tab
  Object.keys(TABS).forEach(function(tabName) {
    var def = TABS[tabName];
    var sheet = ss.getSheetByName(tabName);
    
    // Create tab if it does not already exist
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
    
    // Check if headers already exist
    var currentHeader = sheet.getRange(1, 1, 1, def.headers.length).getValues()[0];
    var needsHeaders = currentHeader[0] === "" || currentHeader[0] !== def.headers[0];
    
    if (needsHeaders) {
      sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
    }
    
    // Style Header Row (Row 1): Charcoal background, white bold text
    var headerRange = sheet.getRange(1, 1, 1, def.headers.length);
    headerRange.setBackground("#282c3f");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(10);
    
    // Freeze Row 1
    sheet.setFrozenRows(1);
    
    // Enable Filter on Header if not active
    if (!sheet.getFilter()) {
      sheet.getRange(1, 1, 500, def.headers.length).createFilter();
    }
    
    // Apply Dropdown Data Validations
    if (def.validations) {
      Object.keys(def.validations).forEach(function(colLetter) {
        var allowed = def.validations[colLetter];
        var rule = SpreadsheetApp.newDataValidation()
          .requireValueInList(allowed, true)
          .setAllowInvalid(false)
          .build();
        sheet.getRange(colLetter + "2:" + colLetter + "500").setDataValidation(rule);
      });
    }
    
    // Format Indian Rupee (INR) currency columns: "₹#,##0.00"
    if (def.currencyCols) {
      def.currencyCols.forEach(function(colLetter) {
        sheet.getRange(colLetter + "2:" + colLetter + "500").setNumberFormat("[$₹-4009] #,##0.00");
      });
    }
    
    // Format Date columns: "yyyy-mm-dd"
    if (def.dateCols) {
      def.dateCols.forEach(function(colLetter) {
        sheet.getRange(colLetter + "2:" + colLetter + "500").setNumberFormat("yyyy-mm-dd");
      });
    }
    
    // Add Conditional Formatting: Highlight Duplicate IDs in red
    if (def.idCol) {
      var idRange = sheet.getRange(def.idCol + "2:" + def.idCol + "500");
      var rule = SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied("=AND(NOT(ISBLANK(" + def.idCol + "2)), COUNTIF(" + def.idCol + "$2:" + def.idCol + "$500, " + def.idCol + "2) > 1)")
        .setBackground("#fde8e8")
        .setFontColor("#9b1c1c")
        .setRanges([idRange])
        .build();
      var rules = sheet.getConditionalFormatRules();
      rules.push(rule);
      sheet.setConditionalFormatRules(rules);
    }
    
    // Insert Initial Seed Data if empty
    if (def.initialData && sheet.getLastRow() === 1) {
      sheet.getRange(2, 1, def.initialData.length, def.initialData[0].length).setValues(def.initialData);
    }
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, def.headers.length);
  });

  SpreadsheetApp.getUi().alert("ReRider Rentals operations workbook initialized successfully! All 7 tabs, validations, and Indian Rupee formatting are in place.");
}
