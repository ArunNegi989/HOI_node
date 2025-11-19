// server.js

// 🔹 SABSE PEHLA: dotenv load karo
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/connection");
const routes = require("./routes/index");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/v1", routes);

app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
