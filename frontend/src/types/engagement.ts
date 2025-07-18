/**
 * Core engagement data types for the analytics dashboard
 */

export interface EngagementItem {
  id: number;
  type: EngagementType;
  timestamp: string;
  user_id: string;
  engagement_score: number;
  source: EngagementSource;
  metadata?: Record<string, unknown>;
}

export type EngagementType =
  | "click"
  | "view"
  | "share"
  | "comment"
  | "like"
  | "download";

export type EngagementSource = "web" | "mobile" | "email" | "social" | "direct";

export interface EngagementFilters {
  type?: EngagementType;
  source?: EngagementSource;
  startDate?: string;
  endDate?: string;
  limit?: number;
  minScore?: number;
  maxScore?: number;
  userId?: string;
}

export interface EngagementAnalytics {
  totalEngagements: number;
  averageScore: number;
  typeBreakdown: Record<EngagementType, number>;
  sourceBreakdown: Record<EngagementSource, number>;
  topPerformers: EngagementItem[];
  trendData: TrendDataPoint[];
  scoreDistribution: ScoreDistribution;
}

export interface TrendDataPoint {
  date: string;
  count: number;
  averageScore: number;
}

export interface ScoreDistribution {
  "0-20": number;
  "21-40": number;
  "41-60": number;
  "61-80": number;
  "81-100": number;
}

export interface EngagementResponse {
  data: EngagementItem[];
  analytics: EngagementAnalytics;
  metadata: ResponseMetadata;
}

export interface ResponseMetadata {
  total: number;
  filtered: boolean;
  dateRange: DateRange | null;
  pagination: PaginationInfo;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AnalyticsSummary {
  totalEngagements: number;
  weeklyGrowth: number;
  topCategories: string[];
  averageSessionTime: string;
  conversionRate: number;
}

export interface CSVUploadResponse {
  message: string;
  processed: number;
  errors: CSVError[];
  sample: EngagementItem[];
}

export interface CSVError {
  row: number;
  column: string;
  error: string;
  value: string;
}

export interface APIError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
}

export interface ErrorState {
  hasError: boolean;
  errorMessage: string;
  errorCode?: string;
  timestamp: string;
}

export interface ThemeState {
  isDark: boolean;
  systemPreference: boolean;
}

export interface DashboardState {
  engagements: EngagementItem[];
  analytics: EngagementAnalytics | null;
  filters: EngagementFilters;
  loading: LoadingState;
  error: ErrorState | null;
  theme: ThemeState;
  lastUpdated: string;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface ExportOptions {
  format: "csv" | "json" | "excel";
  includeFilters: boolean;
  includeAnalytics: boolean;
  dateRange?: DateRange;
}

export interface NotificationMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
}

export interface DrillDownData {
  item: EngagementItem;
  relatedItems: EngagementItem[];
  userProfile: UserProfile;
  timelineData: TimelineEvent[];
}

export interface UserProfile {
  userId: string;
  totalEngagements: number;
  averageScore: number;
  preferredSource: EngagementSource;
  engagementHistory: EngagementItem[];
  lastActive: string;
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  score: number;
  type: EngagementType;
}
