// const express = require("express");
// const mongoose = require("mongoose");
// const crypto = require("crypto");
// const fs = require("fs");
// const axios = require("axios"); // For handling downloads
// const Dataset = require("./models/dataset"); // Dataset schema

// const app = express();
// const PORT = 5000;

// // Connect to MongoDB
// mongoose
//   .connect("mongodb://localhost:27017/", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// // Helper: Generate a file hash from the file content
// const generateHash = (filePath) => {
//   const fileBuffer = fs.readFileSync(filePath); // Read the entire file content
//   return crypto.createHash("sha256").update(fileBuffer).digest("hex");
// };

// // API Endpoint to handle download requests
// app.post("/download", async (req, res) => {
//   const { fileUrl, targetPath } = req.body;

//   try {
//     // Extract metadata
//     const fileName = fileUrl.split("/").pop();
//     const response = await axios.head(fileUrl); // Get file size without downloading
//     const fileSize = parseInt(response.headers["content-length"], 10);

//     // Generate file hash (combining name and size as a proxy before downloading)
//     const fileHashBeforeDownload = crypto
//       .createHash("sha256")
//       .update(fileName + fileSize)
//       .digest("hex");

//     // Check for duplicates based on this hash
//     const existingDataset = await Dataset.findOne({
//       hash: fileHashBeforeDownload,
//     });

//     if (existingDataset) {
//       // Duplicate detected, send alert
//       return res.status(200).json({
//         alert: "Duplicate dataset detected!",
//         existingDataset,
//       });
//     }

//     // If no duplicate, proceed to download
//     const writer = fs.createWriteStream(targetPath);
//     const downloadResponse = await axios({
//       method: "get",
//       url: fileUrl,
//       responseType: "stream",
//     });

//     downloadResponse.data.pipe(writer);

//     writer.on("finish", async () => {
//       // Generate final hash after download (using actual file content)
//       const finalHash = generateHash(targetPath);

//       // Save metadata to the database
//       const newDataset = new Dataset({
//         fileName,
//         fileSize,
//         hash: finalHash,
//         downloadTimestamp: new Date(),
//         downloadPath: targetPath,
//       });

//       await newDataset.save();

//       res.status(201).json({
//         message: "File downloaded successfully!",
//         dataset: newDataset,
//       });
//     });

//     writer.on("error", (err) => {
//       console.error("Download failed:", err);
//       res.status(500).json({ error: "File download failed" });
//     });
//   } catch (error) {
//     console.error("Error processing request:", error);
//     res.status(500).json({ error: "An error occurred" });
//   }
// });

const express = require("express");
const connectDB = require("./config/db"); // Database connection
const fileRoutes = require("./routes/files"); // File routes
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// Routes
app.use("/api/files", fileRoutes); // API routes for file operations

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to DDAS API!");
});

// Start the server
const PORT = process.env.PORT || 5001; // Change to 5001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
