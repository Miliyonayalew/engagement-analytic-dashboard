import { useEffect, useState, useRef } from 'react'
import { useDashboard } from '../contexts/DashboardContext'
import { EngagementFilters, EngagementItem, EngagementType, EngagementSource } from '../types/engagement'
import LoadingSpinner from './LoadingSpinner'
import { apiService } from '../services/api'

const Dashboard: React.FC = () => {
  const { state, actions } = useDashboard()
  const [uploadProgress, setUploadProgress] = useState(0)
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
      actions.uploadCSV(file, setUploadProgress)
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
          
          
          {/* Row 4: Main Content Area */}
          {/* Left Column - Engagement Data */}
          <div className="engagement-section">
            <h3><i className="fas fa-list"></i> Engagement Data</h3>
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