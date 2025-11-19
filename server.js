// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/connection"); // ✅ gets the function
const routes = require("./routes/index");

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB(); // ✅ now this is a real function

// Routes
app.use("/v1", routes);

app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
