const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

// Routes will be imported here
app.use("/api/auth", require("./routes/auth"));
app.use("/api/session", require("./routes/session"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/email", require("./routes/email"));

app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "Classroom Attendance API is running" });
});

const path = require("path");

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.use(require("./middleware/errorHandler"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
