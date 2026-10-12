//Start user on Export tab
document.getElementById("defaultOpen").click();

let exportFile = null;
let importFile = null;

let exportedDialogue = [];
let importedDialogue = [];
let importedDialogueStripped = [];

let exportPosition = 0;
let importPosition = 0;

function ResetFileState() {
  exportFile = null;
  importFile = null;
  exportedDialogue = [];
  importedDialogue = [];
  importedDialogueStripped = [];

  document.getElementById("gameFileExport").value = "";
  document.getElementById("gameFileInput").value = "";
  document.getElementById("exportButton").disabled = true;
  document.getElementById("downloadExportTxtButton").disabled = true;
  document.getElementById("downloadExportCsvButton").disabled = true;
  document.getElementById("importButton").disabled = true;
  document.getElementById("downloadBytesButton").disabled = true;
}

window.addEventListener("pageshow", ResetFileState);

function openTab(evt, tabName) {
  let i, tabcontent, tablinks;

  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

function SetExportFile(event) {
  let file = event.target.files[0];
  if (!file) {
    exportFile = null;
    document.getElementById("exportButton").disabled = true;
    return;
  }
  console.log("Export file selected: " + file.name);
  if (file) {
    exportFile = file;
    document.getElementById("exportButton").disabled = false;
  }
}

function SetImportFile(event) {
  let file = event.target.files[0];
  if (!file) {
    importFile = null;
    document.getElementById("importButton").disabled = true;
    return;
  }
  console.log("Import file selected: " + file.name);
  if (file) {
    importFile = file;
    document.getElementById("importButton").disabled = false;
  }
}

function ExportButtonClick() {
  if (exportFile) {
    ExportGameFile(exportFile);
  }
}

function ImportButtonClick() {
  if (importFile) {
    ImportGameFile(importFile);
  }
}

// #region Main Export Functions
async function ExportGameFile(file) {
  const view = new DataView(
    await file.arrayBuffer(),
    0,
    (await file.arrayBuffer()).byteLength,
  );

  // Starting position in the file
  this.exportPosition = 0;

  // Magic bytes are which should be UTXT
  let magic = String.fromCharCode(
    view.getUint8(this.exportPosition++),
    view.getUint8(this.exportPosition++),
    view.getUint8(this.exportPosition++),
    view.getUint8(this.exportPosition++),
  );
  console.log("Magic number: " + magic);

  let version = view.getUint32(this.exportPosition, true);
  console.log("Version: " + version);
  this.exportPosition += 4;

  // Creation Date is stored as minutes
  let minutes = view.getUint32(this.exportPosition, true);
  //This is a fixed date specified in the original game code
  let date = new Date(2018, 0, 1, 0, 0, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  console.log("Date: " + date.toISOString().split("T")[0]);
  this.exportPosition += 4;

  let tableLength = view.getUint32(this.exportPosition, true);
  console.log("Table Length: " + tableLength);
  this.exportPosition += 4;

  // Find number of lines
  let numberOfLines = ReadUnsignedInteger(view);
  console.log("Number of Lines: " + numberOfLines);

  // Read the line lengths into an array
  let lineLengths = new Array(numberOfLines);
  for (let i = 0; i < numberOfLines; i++) {
    lineLengths[i] = ReadUnsignedInteger(view, this.exportPosition);
  }
  console.log("Lines Lengths: " + lineLengths.length);

  // Check if we've read to end of tabe
  // TEND stand for table end
  let hasReachedTableEnd =
    String.fromCharCode(
      view.getUint8(this.exportPosition++),
      view.getUint8(this.exportPosition++),
      view.getUint8(this.exportPosition++),
      view.getUint8(this.exportPosition++),
    ) == "TEND";
  console.log("Has reached table end: " + hasReachedTableEnd);

  // If we have not reached the table end, end here, as the file is not in the expected format
  if (!hasReachedTableEnd) {
    console.error(
      "Did not reach table end, file may be corrupted or in an unexpected format.",
    );
    return;
  }

  let table = null;

  if (this.exportPosition != tableLength) {
    return;
  } else {
    table = [];
    let textPos = 0;
    for (let i = 0; i < numberOfLines; i++) {
      table.push([textPos, lineLengths[i]]);
      textPos += lineLengths[i];
    }
  }
  let charArray = GetGameCharArrray(
    GetGameDropdownSelected("exportGameSelector"),
  );
  console.dir(
    "Selected Game: " + GetGameDropdownSelected("exportGameSelector"),
  );
  // Empty the exportedDialogue array before populating it with new data.
  // This ensures that we don't accumulate dialogue from previous exports.
  exportedDialogue = [];
  for (let i = 1; i <= numberOfLines; i++) {
    let temp = GetTextFromBytes(table, charArray, view, i);
    exportedDialogue.push(temp);
  }
  console.dir(exportedDialogue);
  document.getElementById("downloadExportTxtButton").disabled = false;
  document.getElementById("downloadExportCsvButton").disabled = false;
}

async function ExportTxtDownload() {
  let dialogAsString = exportedDialogue.join("\n");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([dialogAsString], { type: "text/plain;charset=utf-8" }),
  );
  let fileNameWithoutExtension = exportFile.name.replace(/\.[^/.]+$/, "");
  a.download = fileNameWithoutExtension + "_EXPORT.txt";
  a.click();
  URL.revokeObjectURL(a.href);
}

async function ExportCsvDownload() {
  let TitleRow =
    "Original Text, Machine Translation, First Pass, Second Pass, Final Translation, Notes";
  let CSVString =
    TitleRow + "\n" + exportedDialogue.join("\n").replace(/,/g, ";");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([CSVString], { type: "text/csv;charset=utf-8" }),
  );
  let fileNameWithoutExtension = exportFile.name.replace(/\.[^/.]+$/, "");
  a.download = fileNameWithoutExtension + "_EXPORT.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// #endregion

async function ImportGameFile(file) {
  console.log("Importing game file: " + file.name);
  const fileBuffer = await file.arrayBuffer();
  const view = new DataView(fileBuffer);

  let extension = file.name.split(".").pop().toLowerCase();
  let dialogueString;
  if (extension == "csv") {
    console.dir("Importing CSV file");
    debugger;
    /*file.split("\n").forEach((line) => {
      let columns = line.split(",");
      importedDialogue.push(columns[0]);
    });*/
  } else {
    const decoder = new TextDecoder();
    const fileAsString = decoder.decode(view);
    dialogueString = fileAsString;
  }
  //TODO: Must have a string parsable by linebreaks. Review is this is suitable for CSV
  let dialogueArray = dialogueString.split("\n");
  console.log("Dialogue Array: " + dialogueArray);
  let dialogueArrayStripped = dialogueArray.filter(
    (line) =>
      !/SCREEN|SLIDE_LEFT|SLIDE_RIGHT|\d{3}_\d{3}_\d{2}|"(\d{4})"/.test(line),
  );

  //Date as minutes since 2018 as per game's code
  //If chosen, use today's date, otherwise use the default date for the game
  let gameDate = Date.now();

  let game = GetGameDropdownSelected("importGameSelector");
  //Default Game Dates from reference files, should not impact the game
  if (game == "SPADE_WHITE_JP") {
    gameDate = new Date(2021, 6, 19, 13, 51, 0, 0);
  } else if (game == "SPADE_BLACK_JP") {
    gameDate = new Date(2023, 5, 2, 12, 0, 0, 0);
  } else if (game == "BUSTA_EN") {
    gameDate = new Date(2025, 6, 28, 9, 48, 0, 0);
  } else if (game == "BUSTA2_EN") {
    gameDate = new Date(2025, 2, 10, 14, 43, 0, 0);
  } else if (game == "MISTONIAS_HOPE_EN") {
    gameDate = new Date(2025, 7, 25, 14, 43, 0, 0);
  } else {
    //If the game is not recognized, use a default date of February 1, 2018
    gameDate = new Date(2018, 1, 1, 0, 0, 0, 0);
  }

  let creationDate = Math.round(
    (gameDate.getTime() - new Date(2018, 0, 1, 0, 0, 0, 0).getTime()) /
      1000 /
      60,
  );
  console.log("Creation Date: " + creationDate);

  let charArray = GetGameCharArrray(game);
  importedDialogue = BuildImportedFile(dialogueArray, charArray, creationDate);
  importedDialogueStripped =
    game == "MISTONIAS_HOPE_EN"
      ? BuildImportedFile(dialogueArrayStripped, charArray, creationDate)
      : [];
  document.getElementById("downloadBytesButton").disabled = false;
}

function BuildImportedFile(dialogueArray, charArray, creationDate) {
  const bytes = [];
  bytes.push(85, 84, 88, 84);

  let versionNumber = 1;
  bytes.push(
    versionNumber,
    versionNumber >> 8,
    versionNumber >> 16,
    versionNumber >> 24,
  );
  bytes.push(
    creationDate,
    creationDate >> 8,
    creationDate >> 16,
    creationDate >> 24,
  );

  //CALCULATE INFO
  //convert each char into an index in the array
  let linesAsCharIndexes = [];
  let linesAsBytes = [];
  let lineLengths = [];
  for (let i = 0; i < dialogueArray.length; i++) {
    linesAsCharIndexes.push(ConvertTextToBytes(dialogueArray[i], charArray));
  }

  for (let i = 0; i < linesAsCharIndexes.length; i++) {
    let temp = [];
    for (let j = 0; j < linesAsCharIndexes[i].length; j++) {
      const encoded = WriteUnsignedInteger(linesAsCharIndexes[i][j]);
      for (const byte of encoded) {
        temp.push(byte);
      }
    }
    for (const byte of temp) {
      linesAsBytes.push(byte);
    }
    lineLengths.push(temp.length);
  }

  let finalLineLengths = [];
  for (let i = 0; i < lineLengths.length; i++) {
    const lengthBytes = WriteUnsignedInteger(lineLengths[i]);
    for (const byte of lengthBytes) {
      finalLineLengths.push(byte);
    }
  }
  console.log("Final line Lengths: " + finalLineLengths);
  let numOfLines = WriteUnsignedInteger(dialogueArray.length);

  //TABLE LENGTH (calculated from start of file to after TEND)
  let tableLength = 20 + numOfLines.length + finalLineLengths.length; //24 comes from the 32 bit ints used for magic, version, date, table length, num of lines, tend
  bytes.push(
    tableLength,
    tableLength >> 8,
    tableLength >> 16,
    tableLength >> 24,
  );
  console.log("Table Size " + (24 + finalLineLengths.length));

  //NUM OF LINES
  for (let i = 0; i < numOfLines.length; i++) {
    bytes.push(numOfLines[i]);
  }

  //LINE LENGTH ARRAY (in bytes)
  for (let i = 0; i < finalLineLengths.length; i++) {
    bytes.push(finalLineLengths[i]);
  } // only part of table that is variable size/not a 32 bit int

  //TEND
  bytes.push(84, 69, 78, 68);

  //DIALOGUE DATA
  for (let i = 0; i < linesAsBytes.length; i++) {
    bytes.push(linesAsBytes[i]);
  }
  console.log(linesAsCharIndexes);

  return Uint8Array.from(bytes);
}

function DownloadImportedFile() {
  const fileNameWithoutExtension = importFile.name.replace(/\.[^/.]+$/, "");
  const isMistonia = importedDialogueStripped.length > 0;
  if (!isMistonia) {
    DownloadBytesFile(
      importedDialogue,
      fileNameWithoutExtension + "_EXPORT.bytes",
    );
  }

  if (isMistonia) {
    DownloadBytesFile(
      importedDialogue,
      fileNameWithoutExtension + "_EXPORT_TEXT.bytes",
    );
    DownloadBytesFile(
      importedDialogueStripped,
      fileNameWithoutExtension + "_EXPORT_TALK.bytes",
    );
  }
}

function DownloadBytesFile(contents, fileName) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([contents], { type: "application/octet-stream" }),
  );
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// #region Export Helpers
// Reads variable length unsigned integers and increments position for export.
// This method is only used for exporting, as the import function does not need to read variable length integers.
function ReadUnsignedInteger(view) {
  if (this.exportPosition >= view.Length) {
    return 0;
  }

  // Read the first byte
  let firstNum = view.getUint8(this.exportPosition);
  this.exportPosition++;

  // Check if the first byte has the continuation bit set
  let cont = (firstNum & 128) == 0;
  if (cont) {
    return firstNum & 127;
  } else {
    let secondNum = view.getUint8(this.exportPosition);
    this.exportPosition++;
    cont = (secondNum & 128) == 0;
    if (cont) {
      return ((firstNum & 127) << 7) | (secondNum & 127);
    } else {
      let thirdNum = view.getUint8(this.exportPosition);
      this.exportPosition++;
      cont = (thirdNum & 128) == 0;
      if (cont) {
        return (
          ((firstNum & 127) << 14) | ((secondNum & 127) << 7) | (thirdNum & 127)
        );
      } else {
        let fourthNum = view.getUint8(this.exportPosition);
        this.exportPosition++;
        cont = (fourthNum & 128) == 0;
        if (cont) {
          return (
            ((firstNum & 127) << 21) |
            ((secondNum & 127) << 14) |
            ((thirdNum & 127) << 7) |
            (fourthNum & 127)
          );
        } else {
          //Only up to 4 bytes are supported, so if we get here, return 0
          return 0;
        }
      }
    }
  }
}

function WriteUnsignedInteger(number) {
  let data = [];
  if (number > -1) {
    if (number < 128) {
      data.push(number & 127);
      return data;
    }

    if (number < 16384) {
      data.push(((number & 16383) | 16384) >> 7);
      data.push(number & 127);
      return data;
    }

    if (number < 2097152) {
      data.push(((number & 2097151) | 2097152) >> 14);
      data.push(((number & 16383) | 16384) >> 7);
      data.push(number & 127);
      return data;
    }

    if (number < 268435456) {
      data.push(((number & 268435455) | 268435456) >> 21);
      data.push(((number & 2097151) | 2097152) >> 14);
      data.push(((number & 16383) | 16384) >> 7);
      data.push(number & 127);
      return data;
    }
    return data;
  }
  return data;
}

function GetTextFromBytes(table, charArray, bytes, index) {
  index--;
  let flag = index < 0;
  let result;
  let sb = "";
  if (flag) {
    result = "";
  } else {
    let position = this.exportPosition;
    let num = position + table[index][1];
    sb = "";

    while (this.exportPosition < num) {
      let num2 = ReadUnsignedInteger(bytes);
      let flag2 = num2 == 0;
      if (flag2) {
        sb += "☇";
      } else if (charArray[num2 - 1] == "　") {
        debugger;
        sb += "☈";
      } else if (charArray[num2 - 1] == "\r") {
        sb += "☡";
      } else {
        sb += charArray[num2 - 1];
      }
    }
    result = sb;
  }
  return result;
}
// #endregion

// #region Import Helpers

function ConvertTextToBytes(dialogueString, charArray) {
  const line = [];

  for (let i = 0; i < dialogueString.length; i++) {
    let curChar = dialogueString[i];

    if (curChar === "☇") {
      line.push(0);
      continue;
    }

    if (curChar === "☈") {
      curChar = "\u3000";
    } else if (curChar === "☡") {
      curChar = "\r";
    }

    const index = charArray.indexOf(curChar);
    if (index === -1) {
      console.warn("Character not found:", curChar);
      continue;
    }

    line.push(index + 1);
  }

  return line;
}

// #endregion

// #region General Helpers
function GetGameDropdownSelected(elementId) {
  return document.getElementById(elementId).selectedGame;
}

function GetGameCharArrray(game) {
  switch (game) {
    case "SPADE_WHITE_JP":
      return SPADE_WHITE_JP;
      break;
    case "SPADE_BLACK_JP":
      return SPADE_BLACK_JP;
      break;
    case "BUSTA_EN":
      return BUSTA_EN;
      break;
    case "BUSTA2_EN":
      return BUSTA2_EN;
      break;
    case "MISTONIAS_HOPE_EN":
      return MISTONIAS_HOPE_EN;
      break;
    default:
      return SPADE_WHITE_JP;
      break;
  }
}
// #endregion
