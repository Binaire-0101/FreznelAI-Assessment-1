export interface AIModel {
  id: string;
  name: string;
  family: string;
  pipelineTag: string;
  architectureTag: string;
  weightTag: string;
  safetensorCount: number;
  safetensorSizeMB: number;
  downloads: number;
  likes: number;
  description: string;
  author: string;
  license: string;
  updatedAt: string;
}

export type SearchMode = 'name' | 'family' | 'all';
export type MatchType = 'start' | 'middle' | 'any';

export interface FilterState {
  searchQuery: string;
  searchMode: SearchMode;
  matchType: MatchType;
  pipelineTags: string[];
  familyTags: string[];
  architectureTags: string[];
  weightTags: string[];
  minSafetensorCount: number;
  maxSafetensorCount: number;
  useDebounce: boolean;
  useThrottle: boolean;
  debounceMs: number;
  throttleMs: number;
}

export type SortField = 'safetensorCount' | 'name' | 'downloads' | 'likes' | 'safetensorSizeMB';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  photoURL?: string | null;
}

export interface NetworkState {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  effectiveType?: string;
  lastChecked: string;
}

export interface BackgroundFetchResult {
  success: boolean;
  method: 'promise' | 'xhr' | 'background-fetch';
  durationMs: number;
  bytesReceived: number;
  checksumValid: boolean;
  calculatedSha256: string;
  expectedSha256: string;
  chunksCount: number;
  logs: string[];
  error?: string;
}
