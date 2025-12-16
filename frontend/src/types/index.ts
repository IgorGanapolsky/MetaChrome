// Centralized type definitions
export type { BrowserTab } from '@/entities/tab';
export type { CommandLog } from '@/entities/command';
export type { ApiError } from '@/services';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}
