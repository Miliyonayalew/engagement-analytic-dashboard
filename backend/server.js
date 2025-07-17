const express = require("express");
const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

// Basic health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// TODO: Add engagement data endpoints
app.get("/api/engagement", (req, res) => {
  res.json({ message: "Engagement data endpoint - coming soon" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
