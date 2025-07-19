// Global state management
let currentTheme = localStorage.getItem("theme") || "light";
let engagementData = [];
let analyticsData = {};

// DOM elements
const themeToggle = document.getElementById("themeToggle");
const refreshBtn = document.getElementById("refreshBtn");
const filterType = document.getElementById("filterType");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const limitResults = document.getElementById("limitResults");
const loadingIndicator = document.getElementById("loadingIndicator");
const engagementCards = document.getElementById("engagementCards");
const csvFile = document.getElementById("csvFile");
const uploadBtn = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeTheme();
  setupEventListeners();
  loadInitialData();

  // Set default date range (last 7 days)
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);

  endDate.value = today.toISOString().split("T")[0];
  startDate.value = weekAgo.toISOString().split("T")[0];
});

// Theme Management
function initializeTheme() {
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeToggleIcon();
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
  localStorage.setItem("theme", currentTheme);
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  const icon = themeToggle.querySelector("i");
  icon.className = currentTheme === "light" ? "fas fa-moon" : "fas fa-sun";
}

// Event Listeners
function setupEventListeners() {
  themeToggle.addEventListener("click", toggleTheme);
  refreshBtn.addEventListener("click", loadInitialData);

  // Filter change listeners
  filterType.addEventListener("change", applyFiltersAndRefresh);
  startDate.addEventListener("change", applyFiltersAndRefresh);
  endDate.addEventListener("change", applyFiltersAndRefresh);
  limitResults.addEventListener("change", applyFiltersAndRefresh);

  // CSV upload listeners
  csvFile.addEventListener("change", handleFileSelection);
  uploadBtn.addEventListener("click", handleCSVUpload);
}

// Data Loading and API Calls
async function loadInitialData() {
  showLoading(true);

  try {
    // Load both engagement data and analytics summary
    const [engagementResponse, analyticsResponse] = await Promise.all([
      fetch("/api/engagement"),
      fetch("/api/analytics/summary"),
    ]);

    if (!engagementResponse.ok || !analyticsResponse.ok) {
      throw new Error("Failed to fetch data");
    }

    const engagementResult = await engagementResponse.json();
    const analyticsResult = await analyticsResponse.json();

    engagementData = engagementResult.data;
    analyticsData = engagementResult.analytics;

    // Update UI components
    updateMetricCards(analyticsResult);
    updateEngagementCards(engagementData);
    updateAnalyticsBreakdown(analyticsData.typeBreakdown);
    updateTopPerformers(analyticsData.topPerformers);
  } catch (error) {
    console.error("Error loading data:", error);
    showError("Failed to load data. Please try again.");
  } finally {
    showLoading(false);
  }
}

async function applyFiltersAndRefresh() {
  showLoading(true);

  try {
    const params = new URLSearchParams();

    if (filterType.value) params.append("filter", filterType.value);
    if (startDate.value) params.append("startDate", startDate.value);
    if (endDate.value) params.append("endDate", endDate.value);
    if (limitResults.value) params.append("limit", limitResults.value);

    const response = await fetch(`/api/engagement?${params}`);
    if (!response.ok) throw new Error("Failed to fetch filtered data");

    const result = await response.json();

    engagementData = result.data;
    analyticsData = result.analytics;

    updateEngagementCards(engagementData);
    updateAnalyticsBreakdown(analyticsData.typeBreakdown);
    updateTopPerformers(analyticsData.topPerformers);

    // Update metrics with filtered data
    updateMetricCards({
      totalEngagements: analyticsData.totalEngagements,
      averageScore: analyticsData.averageScore,
      weeklyGrowth: "N/A", // Would need time-series data
      conversionRate: "N/A", // Would need conversion tracking
    });
  } catch (error) {
    console.error("Error applying filters:", error);
    showError("Failed to apply filters. Please try again.");
  } finally {
    showLoading(false);
  }
}

// UI Update Functions
function updateMetricCards(data) {
  document.getElementById("totalEngagements").textContent =
    data.totalEngagements || "-";
  document.getElementById("averageScore").textContent =
    data.averageScore || data.averageSessionTime || "-";
  document.getElementById("weeklyGrowth").textContent = data.weeklyGrowth
    ? `+${data.weeklyGrowth}%`
    : "-";
  document.getElementById("conversionRate").textContent = data.conversionRate
    ? `${data.conversionRate}%`
    : "-";
}

function updateEngagementCards(data) {
  if (!data || data.length === 0) {
    engagementCards.innerHTML =
      '<div class="no-data">No engagement data found</div>';
    return;
  }

  const cardsHTML = data
    .map(
      (item) => `
        <div class="engagement-card">
            <div class="engagement-header">
                <span class="engagement-type">${item.type}</span>
                <span class="engagement-score">${item.engagement_score}</span>
            </div>
            <div class="engagement-meta">
                <span><i class="fas fa-user"></i> ${item.user_id}</span>
                <span><i class="fas fa-clock"></i> ${formatDate(
                  item.timestamp
                )}</span>
                <span><i class="fas fa-device"></i> ${item.source}</span>
            </div>
        </div>
    `
    )
    .join("");

  engagementCards.innerHTML = cardsHTML;
}

function updateAnalyticsBreakdown(typeBreakdown) {
  const breakdownElement = document.getElementById("typeBreakdown");

  if (!typeBreakdown || Object.keys(typeBreakdown).length === 0) {
    breakdownElement.innerHTML =
      '<div class="no-data">No breakdown data available</div>';
    return;
  }

  const breakdownHTML = Object.entries(typeBreakdown)
    .map(
      ([type, count]) => `
        <div class="breakdown-item">
            <span class="breakdown-type">${type}</span>
            <span class="breakdown-count">${count}</span>
        </div>
    `
    )
    .join("");

  breakdownElement.innerHTML = breakdownHTML;
}

function updateTopPerformers(topPerformers) {
  const performersElement = document.getElementById("topPerformers");

  if (!topPerformers || topPerformers.length === 0) {
    performersElement.innerHTML =
      '<div class="no-data">No top performers data</div>';
    return;
  }

  const performersHTML = topPerformers
    .map(
      (performer) => `
        <div class="performer-item">
            <span class="performer-id">${performer.user_id}</span>
            <span class="performer-score">${performer.engagement_score}</span>
        </div>
    `
    )
    .join("");

  performersElement.innerHTML = performersHTML;
}

// CSV Upload Functionality
function handleFileSelection(event) {
  const file = event.target.files[0];
  uploadBtn.disabled = !file;

  if (file) {
    const label = document.querySelector(".upload-label");
    label.innerHTML = `<i class="fas fa-file-csv"></i> ${file.name}`;
    uploadStatus.innerHTML = "";
    uploadStatus.className = "upload-status";
  }
}

async function handleCSVUpload() {
  const file = csvFile.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("csvFile", file);

  try {
    uploadBtn.disabled = true;
    uploadBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Processing...';

    const response = await fetch("/api/engagement/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      uploadStatus.className = "upload-status success";
      uploadStatus.innerHTML = `
                <i class="fas fa-check-circle"></i> 
                Success! Processed ${result.processed} records.
            `;

      // Refresh data after successful upload
      setTimeout(() => {
        loadInitialData();
      }, 1000);
    } else {
      throw new Error(result.error || "Upload failed");
    }
  } catch (error) {
    console.error("Upload error:", error);
    uploadStatus.className = "upload-status error";
    uploadStatus.innerHTML = `
            <i class="fas fa-exclamation-circle"></i> 
            Error: ${error.message}
        `;
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.innerHTML =
      '<i class="fas fa-cloud-upload-alt"></i> Process File';
  }
}

// Utility Functions
function showLoading(show) {
  loadingIndicator.style.display = show ? "flex" : "none";
  engagementCards.style.display = show ? "none" : "block";

  if (show) {
    // Add spinning animation to refresh button
    refreshBtn.innerHTML =
      '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
  } else {
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
  }
}

function showError(message) {
  engagementCards.innerHTML = `
        <div class="error-message" style="
            padding: 2rem;
            text-align: center;
            color: var(--error-color);
            border: 1px solid var(--error-color);
            border-radius: 6px;
            background-color: rgba(239, 68, 68, 0.1);
        ">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Auto-refresh functionality (every 30 seconds)
setInterval(() => {
  if (document.visibilityState === "visible") {
    loadInitialData();
  }
}, 30000);

// Handle browser tab visibility change
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    loadInitialData();
  }
});

// Export functions for testing (if needed)
window.EngagementDashboard = {
  toggleTheme,
  loadInitialData,
  applyFiltersAndRefresh,
  handleCSVUpload,
};
