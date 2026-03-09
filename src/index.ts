/**
 * Public API barrel file for debounce-ts.
 * Re-exports all runtime functions and type definitions.
 * 
 * Features:
 * - Type-safe `this` context preservation for debounced and throttled functions
 * - Full TypeScript generics support for arguments and return types
 * - Leading/trailing edge execution control
 * - Cancel, flush, and pending status methods
 */

export { debounce } from "./debounce.js";
export { clearTimer, isTimerActive, throttle } from "./utils.js";

export type {
  DebounceOptions,
  DebouncedFunction,
  GenericCallback,
  ThrottleOptions,
  ThrottledFunction,
  TimerHandle,
} from "./types.js";
