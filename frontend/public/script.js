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
const downloadCsvBtn = document.getElementById("downloadCsvBtn");

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
  document.body.classList.toggle("dark-mode", currentTheme === "dark");
  updateThemeIcon();
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  localStorage.setItem("theme", currentTheme);
  document.body.classList.toggle("dark-mode");
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = themeToggle.querySelector("i");
  icon.className = currentTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
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

  // CSV download listener
  downloadCsvBtn.addEventListener("click", handleCSVDownload);
}

// Data Loading
async function loadInitialData() {
  showLoading(true);

  try {
    const [engagementResult, analyticsResult] = await Promise.all([
      fetch("/api/engagement").then((res) => res.json()),
      fetch("/api/analytics/summary").then((res) => res.json()),
    ]);

    engagementData = engagementResult.data;
    analyticsData = engagementResult.analytics;

    // Update UI components
    updateMetricCards(analyticsResult);
    updateEngagementCards(engagementData);
    updateAnalyticsBreakdown(analyticsData.typeBreakdown);
    updateTopPerformers(analyticsData.highestScoringEngagements);
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

    if (filterType.value) params.append("type", filterType.value);
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
    updateTopPerformers(analyticsData.highestScoringEngagements);

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
function updateMetricCards(metrics) {
  const metricCards = document.getElementById("metricCards");
  if (!metricCards) return;

  metricCards.innerHTML = `
    <div class="metric-card">
      <div class="metric-icon">
        <i class="fas fa-users"></i>
      </div>
      <div class="metric-content">
        <h3>${metrics.totalEngagements || 0}</h3>
        <p>Total Engagements</p>
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-icon">
        <i class="fas fa-star"></i>
      </div>
      <div class="metric-content">
        <h3>${
          typeof metrics.averageScore === "number"
            ? metrics.averageScore.toFixed(1)
            : "N/A"
        }</h3>
        <p>Average Score</p>
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-icon">
        <i class="fas fa-arrow-up"></i>
      </div>
      <div class="metric-content">
        <h3>${metrics.weeklyGrowth || "N/A"}</h3>
        <p>Weekly Growth</p>
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-icon">
        <i class="fas fa-percentage"></i>
      </div>
      <div class="metric-content">
        <h3>${metrics.conversionRate || "N/A"}</h3>
        <p>Conversion Rate</p>
      </div>
    </div>
  `;
}

function updateEngagementCards(data) {
  if (!data || data.length === 0) {
    engagementCards.innerHTML = `
            <div class="no-data">
                <i class="fas fa-chart-line"></i>
                <p>No engagement data available</p>
            </div>
        `;
    return;
  }

  const cardsHTML = data
    .map(
      (item) => `
            <div class="engagement-card">
                <div class="card-header">
                    <span class="engagement-type">${item.type}</span>
                    <span class="engagement-score">${
                      item.engagement_score
                    }</span>
                </div>
                <div class="card-content">
                    <p><strong>User:</strong> ${item.user_id}</p>
                    <p><strong>Source:</strong> ${item.source}</p>
                    <p><strong>Time:</strong> ${new Date(
                      item.timestamp
                    ).toLocaleString()}</p>
                </div>
            </div>
        `
    )
    .join("");

  engagementCards.innerHTML = cardsHTML;
}

function updateAnalyticsBreakdown(breakdown) {
  const breakdownElement = document.getElementById("typeBreakdown");

  if (!breakdown || Object.keys(breakdown).length === 0) {
    breakdownElement.innerHTML =
      '<div class="no-data">No breakdown data available</div>';
    return;
  }

  const breakdownHTML = Object.entries(breakdown)
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

function updateTopPerformers(highestScoringEngagements) {
  const performersElement = document.getElementById("topPerformers");

  if (!highestScoringEngagements || highestScoringEngagements.length === 0) {
    performersElement.innerHTML =
      '<div class="no-data">No high-scoring engagements</div>';
    return;
  }

  const performersHTML = highestScoringEngagements
    .map(
      (performer) => `
        <div class="performer-item">
            <span class="performer-id">${performer.user_id}</span>
            <span class="performer-type">${performer.type}</span>
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
                Success! Processed ${result.processed} records from ${file.name}.
                <button onclick="clearUploadedData()" style="margin-left: 10px; text-decoration: underline; background: none; border: none; color: inherit; cursor: pointer; font-size: 0.9em;">
                  Clear & use original data
                </button>
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

// Clear uploaded CSV data function
async function clearUploadedData() {
  try {
    const response = await fetch("/api/engagement/clear-uploaded", {
      method: "POST",
    });

    if (response.ok) {
      // Reset upload UI
      csvFile.value = "";
      const label = document.querySelector(".upload-label");
      label.innerHTML = '<i class="fas fa-upload"></i> Upload CSV';
      uploadStatus.innerHTML = "";
      uploadStatus.className = "upload-status";
      uploadBtn.disabled = true;

      // Refresh data
      loadInitialData();
    } else {
      throw new Error("Failed to clear uploaded data");
    }
  } catch (error) {
    console.error("Error clearing uploaded data:", error);
  }
}

// CSV Download Functionality
async function handleCSVDownload() {
  try {
    // Show downloading state
    downloadCsvBtn.disabled = true;
    const originalContent = downloadCsvBtn.innerHTML;
    downloadCsvBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Preparing...';

    // Get current filters to include in export
    const params = new URLSearchParams();
    if (filterType.value) params.append("type", filterType.value);
    if (startDate.value) params.append("startDate", startDate.value);
    if (endDate.value) params.append("endDate", endDate.value);
    if (limitResults.value) params.append("limit", limitResults.value);

    const response = await fetch(`/api/export/csv?${params}`);

    if (!response.ok) throw new Error("Failed to export data");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `engagement-data-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Show success feedback
    downloadCsvBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
    setTimeout(() => {
      downloadCsvBtn.innerHTML = originalContent;
    }, 2000);
  } catch (error) {
    console.error("Download error:", error);
    downloadCsvBtn.innerHTML =
      '<i class="fas fa-exclamation-circle"></i> Error';
    setTimeout(() => {
      downloadCsvBtn.innerHTML = '<i class="fas fa-download"></i> Download CSV';
    }, 2000);
  } finally {
    downloadCsvBtn.disabled = false;
  }
}

// Utility Functions
function showLoading(show) {
  loadingIndicator.style.display = show ? "flex" : "none";
}

function showError(message) {
  engagementCards.innerHTML = `
        <div class="error-message" style="
            background: #fee2e2; 
            border: 1px solid #fecaca; 
            color: #dc2626; 
            padding: 1rem; 
            border-radius: 8px; 
            text-align: center;
        ">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
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
