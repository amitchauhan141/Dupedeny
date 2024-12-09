// module.exports = router;
const express = require("express");
const FileRecord = require("../models/FileRecord");
const users = require("../config/db");
const router = express.Router();

// Validate incoming request body
function validateRequestBody(fields, body) {
  for (const field of fields) {
    if (!body[field]) {
      return `${field} is required`;
    }
  }
  return null;
}

// Check if a file already exists
router.post("/check", async (req, res) => {
  const { fileHash } = req.body;

  if (!fileHash) {
    return res.status(400).json({ message: "fileHash is required" });
  }

  try {
    const record = await FileRecord.findOne({ fileHash });
    if (record) {
      return res.status(200).json({ message: "File exists", record });
    }
    res.status(404).json({ message: "File not found" });
  } catch (err) {
    console.error("Error checking file:", err);
    res.status(500).json({ error: "Error checking file", details: err.message });
  }
});

router.post("/add", async (req, res) => {
  const { fileName, fileHash, fileSize, userId } = req.body;

  console.log("Received data:", req.body); // Log the request body

  const validationError = validateRequestBody(
    ["fileName", "fileHash", "fileSize", "userId"],
    req.body
  );
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    let record = await FileRecord.findOne({ fileHash });
    if (record) {
      console.log("File exists, updating...");
      record.downloadCount++;
      record.downloadHistory.push({
        userId,
        downloadedAt: new Date(),
        status: "completed",
      });
      await record.save();
      return res.status(200).json({ message: "Duplicate detected", record });
    }

    console.log("File not found, adding new record...");
    record = new FileRecord({
      fileName,
      fileHash,
      fileSize,
      firstDownloadedBy: userId,
      downloadHistory: [{ userId, downloadedAt: new Date(), status: "completed" }],
    });
    console.log("Saving file record:", record);  // Log the object to inspect
    await record.save();
    res.status(201).json({ message: "File added successfully", record });
  } catch (err) {
    console.error("Error saving record:", err); // Log the error details
    res.status(500).json({ error: "Error saving record", details: err.message });
  }
});


// Update file status
router.post("/update-status", async (req, res) => {
  const { fileHash, userId, status } = req.body;

  const validationError = validateRequestBody(
    ["fileHash", "userId", "status"],
    req.body
  );
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const record = await FileRecord.findOne({ fileHash });
    if (!record) {
      return res.status(404).json({ message: "File not found" });
    }

    record.downloadHistory.push({
      userId,
      downloadedAt: new Date(),
      status,
    });

    if (status === "completed") {
      record.downloadCount++;
    }

    await record.save();
    res.status(200).json({ message: "Status updated successfully", record });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: "Error updating status", details: err.message });
  }
});

module.exports = router;
