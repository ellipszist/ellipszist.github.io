const SHEET_ID = "497554674";
const API_KEY = "AIzaSyB8OyvmcG1JeIVeMi7rlrcmP159RzSmYBk";

$(document).ready(() => {
  $("#download-btn").on("click", () => {
    incrementDownloadCount();
  });
});

function incrementDownloadCount() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A1?key=${API_KEY}`;
  const requestBody = {
    range: "Sheet1!A1",
    majorDimension: "ROWS",
    values: [[1]],
  };
  $.ajax({
    url,
    type: "PUT",
    data: JSON.stringify(requestBody),
    contentType: "application/json",
    success: (response) => {
      const count = response.updatedCells;
      $("#download-count").text(`ดาวน์โหลด: ${count} ครั้ง`);
    },
    error: (xhr, status, error) => {
      console.error(error);
    },
  });
}
