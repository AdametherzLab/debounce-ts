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
 * Implemented by delegating to debounce with `maxWait` equal to `wait`,
 * ensuring periodic execution while batching rapid successive calls.
 *
 * @param callback - The function to throttle
 * @param wait - The throttle interval in milliseconds (must be non-negative)
 * @param options - Configuration for leading/trailing edge invocation
 * @returns A throttled function with cancel, flush, and pending methods
 * @throws {TypeError} If callback is not a function
 * @throws {RangeError} If wait time is negative
 * @example
 * const throttled = throttle((x: number) => console.log(x), 100, { leading: true });
 * throttled(1); // logs: 1
 * throttled(2); // deferred to trailing edge
 * throttled.cancel(); // cancel pending invocation
 */
export function throttle<TArgs extends readonly unknown[], TReturn>(
  callback: GenericCallback<TArgs, TReturn>,
  wait: number,
  options: ThrottleOptions = {}
): ThrottledFunction<TArgs, TReturn> {
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

  return debouncedFn as ThrottledFunction<TArgs, TReturn>;
}