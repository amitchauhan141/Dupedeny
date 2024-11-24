// async function generateHash(metadata) {
//   const encoder = new TextEncoder();
//   const data = encoder.encode(metadata);
//   const hashBuffer = await crypto.subtle.digest("SHA-256", data);
//   return Array.from(new Uint8Array(hashBuffer))
//     .map((byte) => byte.toString(16).padStart(2, "0"))
//     .join("");
// }

// let pausedDownloads = {};

// // Helper: Check for duplicates via the server
// async function checkDuplicateOnServer(fileName, fileSize, fileHash) {
//   try {
//     const response = await fetch("http://localhost:5000/api/files/add", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         fileName,
//         fileHash,
//         fileSize,
//         userId: "user123", // Replace with actual user ID if needed
//       }),
//     });
//     return response.json();
//   } catch (err) {
//     console.error("Error checking duplicate:", err);
//     return null;
//   }
// }

// chrome.downloads.onDeterminingFilename.addListener(
//   async (downloadItem, suggest) => {
//     console.log("Download started:", downloadItem.filename);
//     try {
//       // Pause the download
//       await chrome.downloads.pause(downloadItem.id);

//       const fileName = downloadItem.filename;
//       const fileSize = downloadItem.fileSize;
//       const metadataString = `${fileName}_${fileSize}`;
//       const fileHash = await generateHash(metadataString);

//       const duplicateResponse = await checkDuplicateOnServer(
//         fileName,
//         fileSize,
//         fileHash
//       );

//       if (duplicateResponse && duplicateResponse.message === "Duplicate detected") {
//         console.log("Duplicate detected:", duplicateResponse.record);
//         pausedDownloads[downloadItem.id] = {
//           fileName,
//           fileHash,
//           location: duplicateResponse.record.firstDownloadedBy, // Replace if more details are available
//         };

//         chrome.notifications.create(downloadItem.id.toString(), {
//           type: "basic",
//           iconUrl: "icon.png",
//           title: "Duplicate File Detected",
//           message: `The file "${fileName}" has already been downloaded.\nFirst downloaded by: ${duplicateResponse.record.firstDownloadedBy}`,
//           buttons: [
//             { title: "Continue Download" },
//             { title: "Cancel Download" },
//           ],
//           requireInteraction: true,
//         });

//         suggest({ filename: fileName, conflict_action: "uniquify" });
//       } else {
//         // Resume download if no duplicate found
//         console.log("No duplicate found. Resuming download.");
//         await chrome.downloads.resume(downloadItem.id);
//         suggest({ filename: fileName });
//       }
//     } catch (error) {
//       console.error("Error in download handler:", error);
//       chrome.downloads.resume(downloadItem.id); // Resume on error
//       suggest({ filename: downloadItem.filename });
//     }

//     return true;
//   }
// );

// chrome.notifications.onButtonClicked.addListener(
//   async (notificationId, buttonIndex) => {
//     const downloadId = parseInt(notificationId);

//     if (pausedDownloads[downloadId]) {
//       try {
//         if (buttonIndex === 0) {
//           await chrome.downloads.resume(downloadId);
//           console.log(`Download ${downloadId} resumed`);
//         } else {
//           await chrome.downloads.cancel(downloadId);
//           console.log(`Download ${downloadId} cancelled`);
//         }

//         delete pausedDownloads[downloadId];
//         chrome.notifications.clear(notificationId);
//       } catch (error) {
//         console.error("Error handling notification click:", error);
//       }
//     }
//   }
// );


async function generateHash(metadata) {
  const encoder = new TextEncoder();
  const data = encoder.encode(metadata);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
    const response = await fetch("http://localhost:5000/api/files/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName,
        fileHash,
        fileSize,
        userId: "user123", // Replace with actual user ID if needed
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

// Handle download events
chrome.downloads.onDeterminingFilename.addListener(
  async (downloadItem, suggest) => {
    console.log("Download started:", downloadItem.filename);
    try {
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

        suggest({ filename: fileName, conflict_action: "uniquify" });
      } else {
        // No duplicate: add to server and resume download
        console.log("No duplicate found. Adding file to DB.");
        await addFileToServer(fileName, fileSize, fileHash);
        await chrome.downloads.resume(downloadItem.id);
        suggest({ filename: fileName });
      }
    } catch (error) {
      console.error("Error in download handler:", error);
      chrome.downloads.resume(downloadItem.id); // Resume on error
      suggest({ filename: downloadItem.filename });
    }

    return true;
  }
);

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(
  async (notificationId, buttonIndex) => {
    const downloadId = parseInt(notificationId);

    if (pausedDownloads[downloadId]) {
      const { fileHash } = pausedDownloads[downloadId];
      try {
        if (buttonIndex === 0) {
          // Continue download
          await chrome.downloads.resume(downloadId);
          await updateFileStatusOnServer(fileHash, "user123", "completed");
          console.log(`Download ${downloadId} resumed and status updated`);
        } else {
          // Cancel download
          await chrome.downloads.cancel(downloadId);
          await updateFileStatusOnServer(fileHash, "user123", "cancelled");
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
