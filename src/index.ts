/**
 * Public API barrel file for debounce-ts.
 * Re-exports all runtime functions and type definitions.
 */

export { debounce } from "./debounce.js";
export { clearTimer, isTimerActive, throttle } from "./utils.js";

export type {
  DebounceOptions,
  DebouncedFunction,
  GenericCallback as AnyFunction,
  ThrottleOptions,
  ThrottledFunction,
  TimerHandle,
} from "./types.js";