const express = require("express");
const connectDB = require("./config/db");
const fileRoutes = require("./routes/files"); // Import file routes
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware
app.use(express.json()); // Parse JSON requests

// Connect to Database
connectDB();

// Use Routes
app.use("/api/files", fileRoutes); // Route for file APIs
app.use("/api/users", userRoutes);


// User Login API (if separate)
app.post("/api/users/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (user) {
    return res.status(200).json({
      message: "Login successful",
      userId: user.userId,
    });
  } else {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
