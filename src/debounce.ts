import type { DebounceOptions, TimerHandle, DebouncedFunction } from "./types.js";

/**
 * Creates a debounced function that delays invoking the callback until after
 * a specified wait period has elapsed since the last invocation.
 * 
 * Type-safe `this` context: The returned debounced function preserves the `this` type
 * of the original callback, allowing proper typing when using class methods or
 * explicit `this` parameters.
 * 
 * @param callback - The function to debounce. Can have an explicit `this` type.
 * @param wait - The number of milliseconds to delay
 * @param options - Configuration options for leading/trailing edge behavior
 * @returns A debounced function with cancel, flush, and pending methods
 * @throws {RangeError} If wait is negative or maxWait is less than wait
 * @throws {Error} If both leading and trailing are false
 * @example
 * // With explicit this context
 * class Counter {
 *   value = 0;
 *   increment() { this.value++; }
 * }
 * const counter = new Counter();
 * const debounced = debounce(counter.increment, 100);
 * debounced.call(counter); // Typesafe this context
 */
export function debounce<TThis, TArgs extends readonly unknown[], TReturn>(
  callback: (this: TThis, ...args: TArgs) => TReturn,
  wait: number,
  options?: DebounceOptions // Make options optional
): DebouncedFunction<TThis, TArgs, TReturn> {
  if (wait < 0) {
    throw new RangeError("wait must be a non-negative number");
  }

  const resolvedOptions: Required<DebounceOptions> = {
    leading: options?.leading ?? false,
    trailing: options?.trailing ?? true,
    maxWait: options?.maxWait,
  };

  if (resolvedOptions.maxWait !== undefined && resolvedOptions.maxWait < wait) {
    throw new RangeError("maxWait must be greater than or equal to wait");
  }

  if (!resolvedOptions.leading && !resolvedOptions.trailing) {
    throw new Error("At least one of leading or trailing must be true");
  }

  let timerId: TimerHandle | undefined;
  let maxTimerId: TimerHandle | undefined;
  let lastArgs: TArgs | undefined;
  let lastThis: TThis | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let result: TReturn | undefined;

  function invokeFunc(time: number): TReturn {
    const args = lastArgs!;
    const context = lastThis!;
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = callback.apply(context, args);
    return result;
  }

  function startTimer(pendingWait: number): void {
    timerId = setTimeout(timerExpired, pendingWait);
  }

  function startMaxTimer(): void {
    if (resolvedOptions.maxWait !== undefined && maxTimerId === undefined) {
      const elapsed = Date.now() - lastInvokeTime;
      maxTimerId = setTimeout(maxTimerExpired, resolvedOptions.maxWait - elapsed);
    }
  }

  function clearTimers(): void {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
    if (maxTimerId !== undefined) {
      clearTimeout(maxTimerId);
      maxTimerId = undefined;
    }
  }

  function leadingEdge(time: number): TReturn | undefined {
    lastInvokeTime = time;
    startTimer(wait);
    startMaxTimer();
    return resolvedOptions.leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    if (resolvedOptions.maxWait === undefined) {
      return timeWaiting;
    }
    
    const maxWaitRemaining = resolvedOptions.maxWait - timeSinceLastInvoke;
    return Math.min(timeWaiting, maxWaitRemaining);
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (resolvedOptions.maxWait !== undefined && timeSinceLastInvoke >= resolvedOptions.maxWait)
    );
  }

  function timerExpired(): void {
    const time = Date.now();
    if (shouldInvoke(time)) {
      trailingEdge(time);
    } else {
      startTimer(remainingWait(time));
    }
  }

  function maxTimerExpired(): void {
    maxTimerId = undefined;
    const time = Date.now();
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
    if (lastArgs) {
      invokeFunc(time);
    }
  }

  function trailingEdge(time: number): TReturn | undefined {
    clearTimers();
    
    if (resolvedOptions.trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function cancel(): void {
    clearTimers();
    lastArgs = undefined;
    lastThis = undefined;
    lastCallTime = undefined;
    lastInvokeTime = 0;
  }

  function flush(): TReturn | undefined {
    if (timerId !== undefined || maxTimerId !== undefined) {
      const time = Date.now();
      clearTimers();
      if (lastArgs) {
        return invokeFunc(time);
      }
    }
    return result;
  }

  function pending(): boolean {
    return timerId !== undefined || maxTimerId !== undefined;
  }

  function debounced(this: TThis, ...args: TArgs): TReturn | undefined {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      clearTimers();
      return invokeFunc(time);
    }

    if (timerId === undefined) {
      startTimer(wait);
      startMaxTimer();
    }

    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced as DebouncedFunction<TThis, TArgs, TReturn>;
}
