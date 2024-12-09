const express = require("express");
const router = express.Router();

const users = [
  {
    userId: "user001",
    email: "user1@example.com",
    password: "password1",
  },
  {
    userId: "user002",
    email: "user2@example.com",
    password: "password2",
  },
  {
    userId: "user003",
    email: "user3@example.com",
    password: "password3",
  },
  {
    userId: "user004",
    email: "user4@example.com",
    password: "password4",
  },
];
console.log("Users variable:", users);

router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

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
  } catch (err) {
    console.error("Error handling login:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
