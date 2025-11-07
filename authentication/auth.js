const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/signup", async (req, res) => {
  const { fullName, phone, email, password } = req.body;
  try {
    const user = new User({ fullName, phone, email, password });
    await user.save();
    req.session.user = {
      uid: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    };
    res.status(201).json({ message: "Sign-Up successful!" });
  } catch (error) {
    res.status(400).json({ message: "Error: " + error.message });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    req.session.user = {
      uid: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      score: user.score,
    };
    res.status(200).json({ message: "Sign-In successful!" });
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

router.get("/signout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not log out." });
    }
    res.redirect("/");
  });
});

module.exports = router;
