const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo"); //  added
const mongoose = require("mongoose"); //  for strictQuery
const connectDB = require("./config/db");
const authRoutes = require("./authentication/auth");
require("dotenv").config();
const User = require("./models/User");

const app = express();

//  Set mongoose strictQuery to silence deprecation warning
mongoose.set("strictQuery", true);

//  Connect to MongoDB
connectDB();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

//  Session Middleware (production-safe)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallbacksecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // same DB URI as in Render
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      // secure: true // uncomment if you use HTTPS
    },
  })
);

// Set view engine
app.set("view engine", "ejs");

// Auth Routes
app.use("/auth", authRoutes);

// Home Route
app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/home", async (req, res) => {
  if (req.session.user) {
    try {
      const topPlayers = await User.find({})
        .sort({ score: -1 })
        .limit(3)
        .select("fullName score");

      const currentUser = await User.findById(req.session.user.uid);

      res.render("home", { user: currentUser, topPlayers });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).send("Error fetching leaderboard");
    }
  } else {
    res.redirect("/auth/signin");
  }
});

// Game Routes
const protectedRoute = (view) => (req, res) =>
  req.session.user
    ? res.render(view, { user: req.session.user })
    : res.redirect("/auth/signin");

app.get("/snake-ladder", protectedRoute("SnakeAndLadder.ejs"));
app.get("/hangman", protectedRoute("HangMan.ejs"));
app.get("/quiz", protectedRoute("Quiz.ejs"));
app.get("/spinwheel", protectedRoute("SpinWheel.ejs"));
app.get("/scenario", protectedRoute("Scenario.ejs"));

app.get("/auth/signin", (req, res) => res.render("signin"));
app.get("/auth/signup", (req, res) => res.render("signup"));

app.get("/article13", (req, res) => res.render("article13.ejs"));
app.get("/article14-18", (req, res) => res.render("article14-18.ejs"));
app.get("/article19-22", (req, res) => res.render("article19-22.ejs"));
app.get("/article23-24", (req, res) => res.render("article23-24.ejs"));
app.get("/article25-28", (req, res) => res.render("article25-28.ejs"));
app.get("/article29-30", (req, res) => res.render("article29-30.ejs"));
app.get("/article31", (req, res) => res.render("article31.ejs"));
app.get("/article31A-31D", (req, res) => res.render("article31A-31D.ejs"));
app.get("/article32-35", (req, res) => res.render("article32-35.ejs"));
app.get("/article36-50", (req, res) => res.render("article36-50.ejs"));
app.get("/article38-46", (req, res) => res.render("article38-46.ejs"));
app.get("/article47-51", (req, res) => res.render("article47-51.ejs"));
app.get("/article51A", (req, res) => res.render("article51A.ejs"));

app.post("/update-score", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = await User.findById(req.session.user.uid);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.score += req.body.score;
    await user.save();

    res.status(200).json({ message: "Score updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error updating score: " + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
