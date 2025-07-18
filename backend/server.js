const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Configure multer for CSV uploads
const upload = multer({ dest: "uploads/" });

// Mock Sam's engagement endpoint URL (would be actual team service in real project)
const ENGAGEMENT_API_URL = "http://localhost:3001/engagement";

// Root route for health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Engagement Integration Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Enhanced engagement endpoint with filters and analytics
app.get("/api/engagement", async (req, res) => {
  try {
    const {
      type,
      source,
      startDate,
      endDate,
      limit = 10,
      minScore,
      maxScore,
    } = req.query;

    // Call Sam's original endpoint
    let engagementData;
    try {
      const response = await axios.get(ENGAGEMENT_API_URL);
      engagementData = response.data;
    } catch (error) {
      // Fallback to mock data if Sam's endpoint is unavailable
      console.log("Using mock data - Sam's endpoint unavailable");
      engagementData = generateMockEngagementData();
    }

    // Apply filters and enhancements
    let processedData = processEngagementData(engagementData, {
      type,
      source,
      startDate,
      endDate,
      limit,
      minScore,
      maxScore,
    });

    // Add analytics insights
    const analytics = generateAnalytics(processedData);

    res.json({
      data: processedData,
      analytics,
      metadata: {
        total: processedData.length,
        filtered: !!(
          type ||
          source ||
          startDate ||
          endDate ||
          minScore ||
          maxScore
        ),
        dateRange: startDate && endDate ? { startDate, endDate } : null,
      },
    });
  } catch (error) {
    console.error("Error fetching engagement data:", error);
    res.status(500).json({ error: "Failed to fetch engagement data" });
  }
});

// CSV upload endpoint for analytics data cleanup
app.post("/api/engagement/upload", upload.single("csvFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const results = [];
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => results.push(cleanAnalyticsData(data)))
    .on("end", () => {
      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        message: "CSV processed successfully",
        processed: results.length,
        sample: results.slice(0, 5),
      });
    })
    .on("error", (error) => {
      console.error("CSV processing error:", error);
      res.status(500).json({ error: "Failed to process CSV" });
    });
});

// Analytics summary endpoint
app.get("/api/analytics/summary", (req, res) => {
  // This would typically query a database
  const mockSummary = {
    totalEngagements: 1250,
    weeklyGrowth: 12.5,
    topCategories: ["social", "email", "direct"],
    averageSessionTime: "4m 32s",
    conversionRate: 3.2,
  };

  res.json(mockSummary);
});

// User segment analytics endpoint (Second Round Addition)
app.get("/api/analytics/segments", (req, res) => {
  const { segment, compareSegments } = req.query;

  // Mock segment data based on client feedback
  const segmentData = {
    premium: {
      totalEngagements: 450,
      averageScore: 85,
      conversionRate: 12.5,
      topActions: ["purchase", "share", "comment"],
    },
    standard: {
      totalEngagements: 650,
      averageScore: 65,
      conversionRate: 8.2,
      topActions: ["view", "click", "share"],
    },
    new: {
      totalEngagements: 150,
      averageScore: 45,
      conversionRate: 3.1,
      topActions: ["view", "click", "signup"],
    },
  };

  const requestedSegment = segment || "all";
  let result;

  if (requestedSegment === "all") {
    // Calculate aggregated totals for all segments
    const allSegments = Object.values(segmentData);
    const totalEngagements = allSegments.reduce(
      (sum, seg) => sum + seg.totalEngagements,
      0
    );
    const totalScores = allSegments.reduce(
      (sum, seg) => sum + seg.averageScore * seg.totalEngagements,
      0
    );
    const averageScore =
      Math.round((totalScores / totalEngagements) * 100) / 100;
    const totalConversions = allSegments.reduce(
      (sum, seg) => sum + (seg.conversionRate * seg.totalEngagements) / 100,
      0
    );
    const conversionRate =
      Math.round((totalConversions / totalEngagements) * 100 * 100) / 100;

    result = {
      totalEngagements,
      averageScore,
      conversionRate,
      topActions: ["view", "click", "share", "purchase"], // Combined top actions
    };
  } else {
    result = segmentData[requestedSegment];
  }

  res.json({
    segment: requestedSegment,
    data: result,
    timestamp: new Date().toISOString(),
  });
});

// Helper functions
function generateMockEngagementData() {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    type: ["click", "view", "share", "comment"][Math.floor(Math.random() * 4)],
    timestamp: new Date(
      Date.now() - Math.random() * 86400000 * 7
    ).toISOString(),
    user_id: `user_${Math.floor(Math.random() * 100)}`,
    engagement_score: Math.floor(Math.random() * 100),
    source: ["web", "mobile", "email"][Math.floor(Math.random() * 3)],
  }));
}

function processEngagementData(data, filters) {
  let processed = [...data];

  // Filter by type
  if (filters.type) {
    processed = processed.filter((item) => item.type === filters.type);
  }

  // Filter by source
  if (filters.source) {
    processed = processed.filter((item) => item.source === filters.source);
  }

  // Filter by date range
  if (filters.startDate && filters.endDate) {
    processed = processed.filter((item) => {
      const itemDate = new Date(item.timestamp);
      return (
        itemDate >= new Date(filters.startDate) &&
        itemDate <= new Date(filters.endDate)
      );
    });
  }

  // Filter by score range
  if (filters.minScore !== undefined) {
    processed = processed.filter(
      (item) => item.engagement_score >= parseInt(filters.minScore)
    );
  }

  if (filters.maxScore !== undefined) {
    processed = processed.filter(
      (item) => item.engagement_score <= parseInt(filters.maxScore)
    );
  }

  return processed.slice(0, parseInt(filters.limit));
}

app.listen(PORT, () => {
  console.log(`🚀 Engagement Integration Server running on port ${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:3000`);
});
