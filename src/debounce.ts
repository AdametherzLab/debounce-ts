import type { DebounceOptions, TimerHandle, DebouncedFunction } from "./types.js";

/**
 * Creates a debounced function that delays invoking the callback until after
 * a specified wait period has elapsed since the last invocation.
 * 
 * @param callback - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param options - Configuration options for leading/trailing edge behavior
 * @returns A debounced function with cancel, flush, and pending methods
 * @throws {RangeError} If wait is negative or maxWait is less than wait
 * @throws {Error} If both leading and trailing are false
 * @example
 * const debounced = debounce((x: string) => console.log(x), 100);
 * debounced("a");
 * debounced("b"); // Only "b" will be logged after 100ms
 */
export function debounce<TArgs extends readonly unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  wait: number,
  options: DebounceOptions = {}
): DebouncedFunction<TArgs, TReturn> {
  if (wait < 0) {
    throw new RangeError("wait must be a non-negative number");
  }
  if (options.maxWait !== undefined && options.maxWait < wait) {
    throw new RangeError("maxWait must be greater than or equal to wait");
  }

  const { leading = false, trailing = true, maxWait } = options;

  if (!leading && !trailing) {
    throw new Error("At least one of leading or trailing must be true");
  }

  let timerId: TimerHandle | undefined;
  let maxTimerId: TimerHandle | undefined;
  let lastArgs: TArgs | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let result: TReturn | undefined;

  function invokeFunc(time: number): TReturn {
    const args = lastArgs!;
    lastArgs = undefined;
    lastInvokeTime = time;
    result = callback(...args);
    return result;
  }

  function startTimer(pendingWait: number): void {
    timerId = setTimeout(timerExpired, pendingWait);
  }

  function startMaxTimer(): void {
    if (maxWait !== undefined && maxTimerId === undefined) {
      const elapsed = Date.now() - lastInvokeTime;
      maxTimerId = setTimeout(maxTimerExpired, maxWait - elapsed);
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
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    if (maxWait === undefined) {
      return timeWaiting;
    }
    
    const maxWaitRemaining = maxWait - timeSinceLastInvoke;
    return Math.min(timeWaiting, maxWaitRemaining);
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
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
    
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    return result;
  }

  function cancel(): void {
    clearTimers();
    lastArgs = undefined;
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

  function debounced(...args: TArgs): TReturn | undefined {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
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

  return debounced as DebouncedFunction<TArgs, TReturn>;
}