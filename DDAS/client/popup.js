// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const viewHashesButton = document.getElementById("view-hashes");
  const closeButton = document.getElementById("close-btn");

  viewHashesButton.addEventListener("click", () => {
    chrome.storage.local.get(["fileHashes"], (result) => {
      const fileHashes = result.fileHashes || [];
      const fileList = document.getElementById("file-list");
      fileList.innerHTML = ""; // Clear existing list

      fileHashes.forEach((file) => {
        const li = document.createElement("li");
        li.textContent = `${file.location} - ${new Date(
          file.timestamp
        ).toLocaleString()}`;
        fileList.appendChild(li);
      });
    });
  });

  closeButton.addEventListener("click", () => {
    window.close();
  });
});
