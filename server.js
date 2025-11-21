// server.js
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/connection"); // ✅ DB connection function
const routes = require("./routes/index");

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 👉 Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectDB();

// Routes
app.use("/v1", routes);

app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
