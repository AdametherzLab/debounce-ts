import type {
  DebounceOptions,
  ThrottleOptions,
  ThrottledFunction,
  GenericCallback,
  TimerHandle
} from "./types.js";
import { debounce } from "./debounce.js";

/**
 * Safely clear a timer handle.
 * @param handle - The timer handle to clear, or null/undefined
 */
export function clearTimer(handle: TimerHandle | null | undefined): void {
  if (handle !== null && handle !== undefined) {
    clearTimeout(handle);
  }
}

/**
 * Check if a timer handle is currently active.
 * @param handle - The timer handle to check
 * @returns True if the handle is valid and active, false otherwise
 */
export function isTimerActive(handle: TimerHandle | null | undefined): boolean {
  return handle !== null && handle !== undefined;
}

/**
 * Creates a throttled function that only invokes the callback at most once
 * per every `wait` milliseconds. Subsequent calls within the wait period
 * are deferred to the trailing edge unless disabled via options.
 *
 * Type-safe `this` context: The returned throttled function preserves the `this` type
 * of the original callback, ensuring proper typing when the callback relies on
 * a specific `this` context.
 *
 * Implemented by delegating to debounce with `maxWait` equal to `wait`,
 * ensuring periodic execution while batching rapid successive calls.
 *
 * @param callback - The function to throttle. Can have an explicit `this` type.
 * @param wait - The throttle interval in milliseconds (must be non-negative)
 * @param options - Configuration for leading/trailing edge invocation
 * @returns A throttled function with cancel, flush, and pending methods
 * @throws {TypeError} If callback is not a function
 * @throws {RangeError} If wait time is negative
 * @example
 * // With class method and this context
 * class Logger {
 *   logs: string[] = [];
 *   add(msg: string) { this.logs.push(msg); }
 * }
 * const logger = new Logger();
 * const throttled = throttle(logger.add, 100, { leading: true });
 * throttled.call(logger, "message"); // Typesafe this context
 */
export function throttle<TThis, TArgs extends readonly unknown[], TReturn>(
  callback: GenericCallback<TThis, TArgs, TReturn>,
  wait: number,
  options: ThrottleOptions = {}
): ThrottledFunction<TThis, TArgs, TReturn> {
  if (typeof callback !== "function") {
    throw new TypeError("Callback must be a function");
  }

  if (wait < 0) {
    throw new RangeError("Wait time must be non-negative");
  }

  const debounceOptions: DebounceOptions = {
    leading: options.leading,
    trailing: options.trailing,
    maxWait: wait
  };

  const debouncedFn = debounce(callback, wait, debounceOptions);

  return debouncedFn as ThrottledFunction<TThis, TArgs, TReturn>;
}
