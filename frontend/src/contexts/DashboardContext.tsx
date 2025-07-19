/**
 * Dashboard Context for managing global state
 * Provides centralized state management for the engagement analytics dashboard
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  DashboardState,
  EngagementFilters,
  EngagementItem,
  EngagementAnalytics,
  ErrorState,
  NotificationMessage,
  ThemeState,
} from '../types/engagement';
import { apiService, getErrorMessage, isAPIError } from '../services/api';

/**
 * Dashboard actions
 */
type DashboardAction =
  | { type: 'SET_LOADING'; payload: { isLoading: boolean; message?: string } }
  | { type: 'SET_ERROR'; payload: ErrorState | null }
  | { type: 'SET_ENGAGEMENTS'; payload: EngagementItem[] }
  | { type: 'SET_ANALYTICS'; payload: EngagementAnalytics }
  | { type: 'SET_FILTERS'; payload: EngagementFilters }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_THEME'; payload: ThemeState }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationMessage }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_LAST_UPDATED' }
  | { type: 'RESET_STATE' };

/**
 * Dashboard context type
 */
interface DashboardContextType {
  state: DashboardState & {
    notifications: NotificationMessage[];
  };
  actions: {
    loadEngagements: (filters?: EngagementFilters) => Promise<void>;
    applyFilters: (filters: EngagementFilters) => Promise<void>;
    uploadCSV: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
    toggleTheme: () => void;
    setTheme: (theme: ThemeState) => void;
    addNotification: (notification: Omit<NotificationMessage, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    clearError: () => void;
    refreshData: () => Promise<void>;
    resetState: () => void;
  };
}

/**
 * Initial state
 */
const initialState: DashboardState & { notifications: NotificationMessage[] } = {
  engagements: [],
  analytics: null,
  filters: {
    limit: 10,
  },
  loading: {
    isLoading: false,
  },
  error: null,
  theme: {
    isDark: false,
    systemPreference: false,
  },
  lastUpdated: new Date().toISOString(),
  notifications: [],
};

/**
 * Dashboard reducer
 */
function dashboardReducer(
  state: DashboardState & { notifications: NotificationMessage[] },
  action: DashboardAction
): DashboardState & { notifications: NotificationMessage[] } {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          isLoading: action.payload.isLoading,
          loadingMessage: action.payload.message,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: { isLoading: false },
      };

    case 'SET_ENGAGEMENTS':
      return {
        ...state,
        engagements: action.payload,
        loading: { isLoading: false },
        error: null,
      };

    case 'SET_ANALYTICS':
      return {
        ...state,
        analytics: action.payload,
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'TOGGLE_THEME':
      const newTheme = {
        ...state.theme,
        isDark: !state.theme.isDark,
      };
      localStorage.setItem('theme', JSON.stringify(newTheme));
      return {
        ...state,
        theme: newTheme,
      };

    case 'SET_THEME':
      localStorage.setItem('theme', JSON.stringify(action.payload));
      return {
        ...state,
        theme: action.payload,
      };

    case 'ADD_NOTIFICATION':
      const notification: NotificationMessage = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      return {
        ...state,
        notifications: [...state.notifications, notification],
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case 'UPDATE_LAST_UPDATED':
      return {
        ...state,
        lastUpdated: new Date().toISOString(),
      };

    case 'RESET_STATE':
      return {
        ...initialState,
        theme: state.theme, // Preserve theme
      };

    default:
      return state;
  }
}

/**
 * Dashboard context
 */
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

/**
 * Dashboard provider props
 */
interface DashboardProviderProps {
  children: React.ReactNode;
}

/**
 * Dashboard provider component
 */
export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  /**
   * Initialize theme from localStorage
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      try {
        const themeState = JSON.parse(savedTheme) as ThemeState;
        dispatch({ type: 'SET_THEME', payload: themeState });
      } catch (error) {
        console.warn('Failed to parse saved theme:', error);
      }
    } else {
      // Set based on system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      dispatch({
        type: 'SET_THEME',
        payload: {
          isDark: systemPrefersDark,
          systemPreference: true,
        },
      });
    }
  }, []);

  /**
   * Apply theme to document
   */
  useEffect(() => {
    if (state.theme.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme.isDark]);

  /**
   * Auto-remove notifications after duration
   */
  useEffect(() => {
    const timeouts = state.notifications.map(notification => {
      if (notification.duration) {
        return setTimeout(() => {
          dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
        }, notification.duration);
      }
      return null;
    }).filter(Boolean);

    return () => {
      timeouts.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [state.notifications]);

  /**
   * Load engagements with filters
   */
  const loadEngagements = useCallback(async (filters: EngagementFilters = {}) => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Loading engagements...' } });
    
    try {
      const response = await apiService.getEngagements(filters);
      dispatch({ type: 'SET_ENGAGEMENTS', payload: response.data });
      dispatch({ type: 'SET_ANALYTICS', payload: response.analytics });
      dispatch({ type: 'UPDATE_LAST_UPDATED' });
    } catch (error) {
      const errorState: ErrorState = {
        hasError: true,
        errorMessage: getErrorMessage(error),
        errorCode: isAPIError(error) ? error.code : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'SET_ERROR', payload: errorState });
      
      // Add notification for error
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'error',
          title: 'Failed to load engagements',
          message: errorState.errorMessage,
          duration: 5000,
        },
      });
    }
  }, []);

  /**
   * Apply filters
   */
  const applyFilters = useCallback(async (filters: EngagementFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
    await loadEngagements(filters);
  }, [loadEngagements]);

  /**
   * Upload CSV file
   */
  const uploadCSV = useCallback(async (file: File, onProgress?: (progress: number) => void) => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Uploading CSV...' } });
    
    try {
      const response = await apiService.uploadCSV(file, onProgress);
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
      
      // Add success notification
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'success',
          title: 'CSV uploaded successfully',
          message: `Processed ${response.processed} records`,
          duration: 3000,
        },
      });
      
      // Refresh data
      await loadEngagements(state.filters);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      dispatch({
        type: 'SET_ERROR',
        payload: {
          hasError: true,
          errorMessage,
          errorCode: isAPIError(error) ? error.code : 'UPLOAD_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
      
      // Add notification for error
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'error',
          title: 'Failed to upload CSV',
          message: errorMessage,
          duration: 5000,
        },
      });
    }
  }, [state.filters, loadEngagements]);

  /**
   * Toggle theme
   */
  const toggleTheme = useCallback(() => {
    dispatch({ type: 'TOGGLE_THEME' });
  }, []);

  /**
   * Set theme
   */
  const setTheme = useCallback((theme: ThemeState) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  /**
   * Add notification
   */
  const addNotification = useCallback((notification: Omit<NotificationMessage, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  /**
   * Remove notification
   */
  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  /**
   * Refresh data
   */
  const refreshData = useCallback(async () => {
    await loadEngagements(state.filters);
  }, [state.filters, loadEngagements]);

  /**
   * Reset state
   */
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  /**
   * Context value
   */
  const contextValue: DashboardContextType = {
    state,
    actions: {
      loadEngagements,
      applyFilters,
      uploadCSV,
      toggleTheme,
      setTheme,
      addNotification,
      removeNotification,
      clearError,
      refreshData,
      resetState,
    },
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

/**
 * Custom hook to use dashboard context
 */
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export default DashboardContext; 