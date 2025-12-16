// Centralized type definitions
export type { BrowserTab } from '@/entities/tab';
export type { CommandLog } from '@/entities/command';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}
