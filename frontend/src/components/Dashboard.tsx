import { useEffect, useState, useRef } from 'react'
import { useDashboard } from '../contexts/DashboardContext'
import { EngagementFilters, EngagementItem, EngagementType, EngagementSource } from '../types/engagement'
import LoadingSpinner from './LoadingSpinner'
import { apiService } from '../services/api'

const Dashboard: React.FC = () => {
  const { state, actions } = useDashboard()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFileName, setUploadedFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localFilters, setLocalFilters] = useState<EngagementFilters>({
    limit: 10,
  })
  
  // Second Round: User Segment & Export State
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [segmentData, setSegmentData] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [cardToggleStates, setCardToggleStates] = useState<{[key: string]: boolean}>({
    analytics: true,
    segments: true,
    export: false,
    upload: true,
    breakdown: true,
  })

  // Load initial data
  useEffect(() => {
    actions.loadEngagements()
  }, [])

  // Handle theme toggle
  const handleThemeToggle = () => {
    actions.toggleTheme()
  }

  // Handle refresh
  const handleRefresh = () => {
    actions.refreshData()
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof EngagementFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  // Apply filters
  const handleApplyFilters = () => {
    actions.applyFilters(localFilters)
  }

  // Reset filters
  const handleResetFilters = () => {
    const resetFilters = { limit: 10 }
    setLocalFilters(resetFilters)
    actions.applyFilters(resetFilters)
  }

  // Handle CSV upload
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFileName(file.name)
      actions.uploadCSV(file, setUploadProgress)
    }
  }

  // Handle clear uploaded data
  const handleClearUploadedData = async () => {
    try {
      await fetch('/api/engagement/clear-uploaded', { method: 'POST' })
      setUploadedFileName('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      actions.refreshData()
    } catch (error) {
      console.error('Failed to clear uploaded data:', error)
    }
  }

  // Second Round: Handle segment selection
  const handleSegmentChange = async (segment: string) => {
    setSelectedSegment(segment)
    try {
      const data = await apiService.getSegmentAnalytics(segment)
      setSegmentData(data)
    } catch (error) {
      console.error('Failed to load segment data:', error)
    }
  }

  // Second Round: Handle CSV export
  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const blob = await apiService.exportCSV(true)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `engagement-data-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Second Round: Handle card toggle (Neha's UI)
  const handleCardToggle = (cardId: string) => {
    setCardToggleStates(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  // Load segment data on component mount
  useEffect(() => {
    handleSegmentChange('all')
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Format score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  // Get engagement type icon
  const getEngagementIcon = (type: EngagementType) => {
    const icons = {
      click: 'fas fa-mouse-pointer',
      view: 'fas fa-eye',
      share: 'fas fa-share',
      comment: 'fas fa-comment',
      like: 'fas fa-heart',
      download: 'fas fa-download'
    }
    return icons[type] || 'fas fa-circle'
  }

  // Check if filters are applied
  const hasFilters = !!(localFilters.type || localFilters.source || localFilters.startDate || localFilters.endDate)

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-content">
          <h1><i className="fas fa-chart-line"></i> Engagement Dashboard</h1>
          <div className="header-controls">
            <button onClick={handleThemeToggle} className="theme-toggle">
              <i className={state.theme.isDark ? 'fas fa-sun' : 'fas fa-moon'}></i>
            </button>
            <button onClick={handleRefresh} className="refresh-btn">
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <div className="dashboard-grid">
          {/* Row 1: Filters - Full Width */}
          <div className="filters-section">
            <h3><i className="fas fa-filter"></i> Filters</h3>
            <div className="filter-controls">
              <div className="filter-group">
                <label htmlFor="type-filter">Type:</label>
                <select 
                  id="type-filter"
                  value={localFilters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                >
                  <option value="">All Types</option>
                  <option value="click">Click</option>
                  <option value="view">View</option>
                  <option value="share">Share</option>
                  <option value="comment">Comment</option>
                  <option value="like">Like</option>
                  <option value="download">Download</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="source-filter">Source:</label>
                <select 
                  id="source-filter"
                  value={localFilters.source || ''}
                  onChange={(e) => handleFilterChange('source', e.target.value || undefined)}
                >
                  <option value="">All Sources</option>
                  <option value="web">Web</option>
                  <option value="mobile">Mobile</option>
                  <option value="email">Email</option>
                  <option value="social">Social</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="limit-filter">Limit:</label>
                <select 
                  id="limit-filter"
                  value={localFilters.limit || 10}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="start-date">Start Date:</label>
                <input 
                  type="date" 
                  id="start-date"
                  value={localFilters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                />
              </div>
              
              <div className="filter-group">
                <label htmlFor="end-date">End Date:</label>
                <input 
                  type="date" 
                  id="end-date"
                  value={localFilters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                />
              </div>
              
              <div className="filter-actions">
                <button onClick={handleApplyFilters} className="apply-btn">
                  <i className="fas fa-check"></i> Apply
                </button>
                <button onClick={handleResetFilters} className="reset-btn">
                  <i className="fas fa-undo"></i> Reset
                </button>
              </div>
            </div>
          </div>
          
          {/* Row 2: Key Metrics Overview - Full Width */}
          <div className="metrics-overview-section">
            <div className="card-header">
              <h3><i className="fas fa-chart-line"></i> Key Metrics</h3>
              <button 
                onClick={() => handleCardToggle('analytics')}
                className={`card-toggle ${cardToggleStates.analytics ? 'active' : ''}`}
              >
                <i className={`fas ${cardToggleStates.analytics ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </button>
            </div>
            {cardToggleStates.analytics && state.analytics ? (
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon">
                    <i className="fas fa-mouse-pointer"></i>
                  </div>
                  <div className="metric-content">
                    <h4>Total Engagements</h4>
                    <p className="metric-value">{state.analytics.totalEngagements}</p>
                    <span className="metric-label">Filtered Results</span>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">
                    <i className="fas fa-star"></i>
                  </div>
                  <div className="metric-content">
                    <h4>Average Score</h4>
                    <p className="metric-value">
                      {state.analytics.averageScore !== null ? state.analytics.averageScore.toFixed(1) : 'N/A'}
                    </p>
                    <span className="metric-label">Engagement Quality</span>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">
                    <i className="fas fa-trophy"></i>
                  </div>
                  <div className="metric-content">
                                          <h4>Highest Scoring</h4>
                      <p className="metric-value">{state.analytics.highestScoringEngagements.length}</p>
                      <span className="metric-label">Top Interactions</span>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">
                    <i className="fas fa-chart-bar"></i>
                  </div>
                  <div className="metric-content">
                    <h4>Engagement Types</h4>
                    <p className="metric-value">{Object.keys(state.analytics.typeBreakdown).length}</p>
                    <span className="metric-label">Active Categories</span>
                  </div>
                </div>
                             </div>
             ) : cardToggleStates.analytics ? (
               <div className="metrics-loading">
                 <i className="fas fa-chart-line"></i>
                 <p>Loading metrics...</p>
               </div>
             ) : null}
          </div>
          
          {/* Row 3: User Segments - Full Width */}
          <div className="user-segments-section">
            <div className="card-header">
              <h3><i className="fas fa-users"></i> User Segments</h3>
              <button 
                onClick={() => handleCardToggle('segments')}
                className={`card-toggle ${cardToggleStates.segments ? 'active' : ''}`}
              >
                <i className={`fas ${cardToggleStates.segments ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </button>
            </div>
            {cardToggleStates.segments && (
              <div className="segment-selector-row">
              <div className="segment-buttons">
                <button 
                  onClick={() => handleSegmentChange('all')}
                  className={`segment-btn ${selectedSegment === 'all' ? 'active' : ''}`}
                >
                  <i className="fas fa-globe"></i>
                  <span>All Users</span>
                </button>
                <button 
                  onClick={() => handleSegmentChange('premium')}
                  className={`segment-btn ${selectedSegment === 'premium' ? 'active' : ''}`}
                >
                  <i className="fas fa-crown"></i>
                  <span>Premium Users</span>
                </button>
                <button 
                  onClick={() => handleSegmentChange('standard')}
                  className={`segment-btn ${selectedSegment === 'standard' ? 'active' : ''}`}
                >
                  <i className="fas fa-user"></i>
                  <span>Standard Users</span>
                </button>
                <button 
                  onClick={() => handleSegmentChange('new')}
                  className={`segment-btn ${selectedSegment === 'new' ? 'active' : ''}`}
                >
                  <i className="fas fa-user-plus"></i>
                  <span>New Users</span>
                </button>
              </div>
              
              {segmentData && (
                <div className="segment-metrics-inline">
                  <div className="segment-metric">
                    <span className="segment-metric-value">{segmentData.data?.totalEngagements || 'N/A'}</span>
                    <span className="segment-metric-label">Total</span>
                  </div>
                  <div className="segment-metric">
                    <span className="segment-metric-value">{segmentData.data?.averageScore || 'N/A'}</span>
                    <span className="segment-metric-label">Avg Score</span>
                  </div>
                  <div className="segment-metric">
                    <span className="segment-metric-value">{segmentData.data?.conversionRate || 'N/A'}%</span>
                    <span className="segment-metric-label">Conversion</span>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
          
          {/* Row 4: Main Content Area */}
          {/* Left Column - Engagement Data */}
          <div className="engagement-section">
            <div className="section-header">
              <h3><i className="fas fa-list"></i> Engagement Data</h3>
              <button 
                onClick={handleExportCSV}
                className="download-csv-btn"
                disabled={isExporting || state.loading.isLoading}
                title="Download current data as CSV"
              >
                <i className={isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-download'}></i>
                {isExporting ? 'Preparing...' : 'Download CSV'}
              </button>
            </div>
            {state.error ? (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
                <p>{state.error.errorMessage}</p>
                <button onClick={actions.clearError} className="clear-error-btn">
                  <i className="fas fa-times"></i> Clear
                </button>
              </div>
            ) : state.loading.isLoading ? (
              <LoadingSpinner message={state.loading.loadingMessage || "Loading engagements..."} />
            ) : (
              <div className="engagement-content">
                <div className="engagement-header">
                  <p>Showing {state.engagements.length} engagements</p>
                  <p className="last-updated">Last updated: {formatDate(state.lastUpdated)}</p>
                </div>
                
                <div className="engagement-list">
                  {state.engagements.length > 0 ? (
                    state.engagements.map((engagement) => (
                      <div key={engagement.id} className="engagement-item">
                        <div className="engagement-icon">
                          <i className={getEngagementIcon(engagement.type)}></i>
                        </div>
                        <div className="engagement-details">
                          <div className="engagement-type">{engagement.type}</div>
                          <div className="engagement-user">User: {engagement.user_id}</div>
                          <div className="engagement-source">Source: {engagement.source}</div>
                          <div className="engagement-time">{formatDate(engagement.timestamp)}</div>
                        </div>
                        <div className="engagement-score">
                          <span className={`score-badge ${getScoreColor(engagement.engagement_score)}`}>
                            {engagement.engagement_score}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-data">
                      <i className="fas fa-chart-line"></i>
                      <p>{hasFilters ? 'No engagement found for the selected filters' : 'No engagement data available'}</p>
                      {hasFilters ? (
                        <button onClick={handleResetFilters} className="reset-btn">
                          <i className="fas fa-undo"></i> Clear Filters
                        </button>
                      ) : (
                        <button onClick={handleRefresh} className="refresh-btn">
                          <i className="fas fa-sync-alt"></i> Refresh
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Tools & Actions */}
          <div className="tools-section">
            {/* CSV Upload */}
            <div className="upload-card">
              <div className="card-header">
                <h4><i className="fas fa-upload"></i> CSV Upload</h4>
                <button 
                  onClick={() => handleCardToggle('upload')}
                  className={`card-toggle ${cardToggleStates.upload ? 'active' : ''}`}
                >
                  <i className={`fas ${cardToggleStates.upload ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                </button>
              </div>
              {cardToggleStates.upload && (
              <div className="upload-content">
                <div className="upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    style={{ display: 'none' }}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-btn"
                    disabled={state.loading.isLoading}
                  >
                    <i className="fas fa-file-csv"></i> 
                    {uploadedFileName ? uploadedFileName : 'Choose CSV File'}
                  </button>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                      <span className="progress-text">{uploadProgress}%</span>
                    </div>
                  )}
                </div>
                {uploadedFileName && (
                  <div className="upload-success">
                    <i className="fas fa-check-circle"></i>
                    <span>Successfully uploaded: {uploadedFileName}</span>
                    <button
                      onClick={handleClearUploadedData}
                      className="ml-auto text-xs underline hover:no-underline"
                    >
                      Clear & use original data
                    </button>
                  </div>
                )}
                <div className="upload-help">
                  <p>Upload CSV with engagement data</p>
                </div>
              </div>
              )}
            </div>
            
            
            {/* Type Breakdown */}
            {state.analytics && (
              <div className="breakdown-card">
                <div className="card-header">
                  <h4><i className="fas fa-chart-pie"></i> Type Breakdown</h4>
                  <button 
                    onClick={() => handleCardToggle('breakdown')}
                    className={`card-toggle ${cardToggleStates.breakdown ? 'active' : ''}`}
                  >
                    <i className={`fas ${cardToggleStates.breakdown ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  </button>
                </div>
                {cardToggleStates.breakdown && (
                  <div className="breakdown-content">
                  {Object.keys(state.analytics.typeBreakdown).length > 0 ? (
                    Object.entries(state.analytics.typeBreakdown).map(([type, count]) => (
                      <div key={type} className="breakdown-item">
                        <i className={getEngagementIcon(type as EngagementType)}></i>
                        <span className="breakdown-label">{type}</span>
                        <span className="breakdown-count">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-data-text">No breakdown data available</p>
                  )}
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Notifications */}
      {state.notifications.length > 0 && (
        <div className="notifications">
          {state.notifications.map((notification) => (
            <div key={notification.id} className={`notification ${notification.type}`}>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
              </div>
              <button 
                onClick={() => actions.removeNotification(notification.id)}
                className="notification-close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard 