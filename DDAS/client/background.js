async function generateHash(metadata) {
  const encoder = new TextEncoder();
  const data = encoder.encode(metadata);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
// Get userId from Chrome storage
async function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["userId"], (result) => {
      resolve(result.userId || null);
    });
  });
}
let pausedDownloads = {};

// Helper: Check if a file already exists on the server
async function checkFileOnServer(fileHash) {
  try {
    const response = await fetch("http://localhost:5000/api/files/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileHash }),
    });
    return response.json();
  } catch (err) {
    console.error("Error checking file on server:", err);
    return null;
  }
}
// Helper: Add a file record to the server
async function addFileToServer(fileName, fileSize, fileHash) {
  try {
    // Fetch the logged-in userId from local storage
    const { userId } = await new Promise((resolve) =>
      chrome.storage.local.get(["userId"], resolve)
    );

    if (!userId) {
      console.error("User not logged in. Cannot add file.");
      return null;
    }

    const response = await fetch("http://localhost:5000/api/files/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName,
        fileHash,
        fileSize,
        userId, // Use the dynamic userId
      }),
    });
    return response.json();
  } catch (err) {
    console.error("Error adding file to server:", err);
    return null;
  }
}

// Helper: Update file status on the server
async function updateFileStatusOnServer(fileHash, userId, status) {
  try {
    const response = await fetch("http://localhost:5000/api/files/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileHash, userId, status }),
    });
    return response.json();
  } catch (err) {
    console.error("Error updating file status:", err);
    return null;
  }
}

chrome.downloads.onDeterminingFilename.addListener(
  async (downloadItem, suggest) => {
    console.log("Download started:", downloadItem.filename);
    try {
      // Check if the user is logged in
      const { userId } = await new Promise((resolve) =>
        chrome.storage.local.get(["userId"], resolve)
      );

      if (!userId) {
        console.error("User not logged in. Cannot process download.");
        suggest({ filename: downloadItem.filename });
        return true;
      }
      console.log("Download started by user:", userId);
      
      // Pause the download
      await chrome.downloads.pause(downloadItem.id);

      const fileName = downloadItem.filename;
      const fileSize = downloadItem.fileSize;
      const metadataString = `${fileName}_${fileSize}`;
      const fileHash = await generateHash(metadataString);

      // Check if the file already exists
      const checkResponse = await checkFileOnServer(fileHash);

      if (checkResponse && checkResponse.message === "File exists") {
        console.log("Duplicate detected:", checkResponse.record);
        pausedDownloads[downloadItem.id] = {
          fileName,
          fileHash,
          location: checkResponse.record.firstDownloadedBy,
        };

        chrome.notifications.create(downloadItem.id.toString(), {
          type: "basic",
          iconUrl: "icon.png",
          title: "Duplicate File Detected",
          message: `The file "${fileName}" already exists.\nFirst downloaded by: ${checkResponse.record.firstDownloadedBy}`,
          buttons: [
            { title: "Continue Download" },
            { title: "Cancel Download" },
          ],
          requireInteraction: true,
        });

        // Only call suggest once with the conflict action
        suggest({ filename: fileName, conflict_action: "uniquify" });
      } else {
        // No duplicate: add to server and resume download
        console.log("No duplicate found. Adding file to DB.");
        const addFileResponse = await addFileToServer(fileName, fileSize, fileHash);
        if (addFileResponse) {
          // If file added successfully, resume the download
          await chrome.downloads.resume(downloadItem.id);
          suggest({ filename: fileName });
        } else {
          console.error("Error adding file to DB.");
          suggest({ filename: downloadItem.filename });  // If failed to add file, just suggest original filename
        }
      }
    } catch (error) {
      console.error("Error in download handler:", error);
      suggest({ filename: downloadItem.filename });
    }

    return true;
  }
);

// Function to initialize userId
async function initializeUserId() {
  const { userId } = await new Promise((resolve) =>
    chrome.storage.local.get(["userId"], resolve)
  );
  return userId;
}

// Call the initializeUserId function when the script starts
initializeUserId().then((userId) => {
  console.log("UserId initialized:", userId);
  // You can now use the userId in other parts of your script.
});

chrome.notifications.onButtonClicked.addListener(
  async (notificationId, buttonIndex) => {
    const downloadId = parseInt(notificationId);

    if (pausedDownloads[downloadId]) {
      const { fileHash } = pausedDownloads[downloadId];
      
      // Fetch userId dynamically inside the notification handler
      const { userId } = await new Promise((resolve) =>
        chrome.storage.local.get(["userId"], resolve)
      );

      if (!userId) {
        console.error("User ID not found. Cannot proceed with the action.");
        return;
      }

      try {
        if (buttonIndex === 0) {
          // Continue download
          await chrome.downloads.resume(downloadId);
          await updateFileStatusOnServer(fileHash, userId, "completed");
          console.log(`Download ${downloadId} resumed and status updated`);
        } else {
          // Cancel download
          await chrome.downloads.cancel(downloadId);
          await updateFileStatusOnServer(fileHash, userId, "cancelled");
          console.log(`Download ${downloadId} cancelled and status updated`);
        }

        delete pausedDownloads[downloadId];
        chrome.notifications.clear(notificationId);
      } catch (error) {
        console.error("Error handling notification click:", error);
      }
    }
  }
);

