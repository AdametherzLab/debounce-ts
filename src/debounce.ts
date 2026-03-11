import type { DebounceOptions, TimerHandle, DebouncedFunction } from "./types.js";

/**
 * Creates a debounced function that delays invoking `callback` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * The debounced function comes with a `cancel` method to cancel delayed `callback` invocations
 * and a `flush` method to immediately invoke them.
 *
 * Type-safe `this` context: The returned debounced function, its `flush` and `cancel` methods
 * correctly infer and preserve the `this` context of the original callback, improving type safety
 * and developer experience.
 *
 * @template TThis - The type of `this` context for the callback function.
 * @template TArgs - The type of arguments for the callback function.
 * @template TReturn - The return type of the callback function.
 *
 * @param callback - The function to debounce. Can have an explicit `this` type.
 * @param wait - The number of milliseconds to delay. Must be non-negative.
 * @param options - Options object to configure leading/trailing edge and maxWait behavior.
 * @returns A debounced function with `cancel`, `flush`, and `pending` methods.
 *          The debounced function returns a Promise that resolves with the callback's result
 *          or rejects if superseded or cancelled.
 *
 * @throws {RangeError} If `wait` is negative or `maxWait` is less than `wait`.
 * @throws {Error} If both `leading` and `trailing` options are false.
 *
 * @example
 * // Basic usage
 * const log = debounce((text: string) => console.log(text), 200);
 * log('hello'); // Will log 'hello' after 200ms if not called again.
 *
 * @example
 * // With `this` context
 * class MyLogger {
 *   prefix = 'LOG: ';
 *   logMessage(message: string) {
 *     return this.prefix + message;
 *   }
 * }
 * const logger = new MyLogger();
 * const debouncedLog = debounce(logger.logMessage, 100);
 * // `this` context is correctly inferred and preserved
 * debouncedLog.call(logger, 'hello world').then(result => console.log(result)); // LOG: hello world
 *
 * @example
 * // Using `flush` with `this` context
 * class Counter {
 *   count = 0;
 *   increment(value: number) {
 *     this.count += value;
 *     return this.count;
 *   }
 * }
 * const counter = new Counter();
 * const debouncedIncrement = debounce(counter.increment, 500, { trailing: true });
 * debouncedIncrement.call(counter, 1);
 * debouncedIncrement.call(counter, 2);
 * const finalCount = debouncedIncrement.flush(); // Immediately invokes with last args and `this`
 * console.log(finalCount); // 3
 */
export function debounce<TThis, TArgs extends readonly unknown[], TReturn>(
  callback: (this: TThis, ...args: TArgs) => TReturn,
  wait: number,
  options?: DebounceOptions
): DebouncedFunction<TThis, TArgs, TReturn> {
  if (wait < 0) throw new RangeError("wait must be non-negative");

  const resolvedOptions = {
    leading: options?.leading ?? false,
    trailing: options?.trailing ?? true,
    maxWait: options?.maxWait
  };

  if (resolvedOptions.maxWait !== undefined && resolvedOptions.maxWait < wait) {
    throw new RangeError("maxWait must be ≥ wait");
  }

  if (!resolvedOptions.leading && !resolvedOptions.trailing) {
    throw new Error("At least one of leading/trailing must be true");
  }

  let timerId: TimerHandle | undefined;
  let maxTimerId: TimerHandle | undefined;
  let lastArgs: TArgs | undefined;
  let lastThis: TThis | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let currentPromise: Promise<TReturn> | undefined;
  let currentResolve: ((value: TReturn) => void) | undefined;
  let currentReject: ((reason?: any) => void) | undefined;
  let lastResult: TReturn | undefined; // Store the last successful result for flush

  function clearTimers(): void {
    clearTimeout(timerId);
    clearTimeout(maxTimerId);
    timerId = maxTimerId = undefined;
  }

  function cancelPendingPromise(reason: string): void {
    if (currentReject) {
      currentReject(new Error(reason));
      currentPromise = currentResolve = currentReject = undefined;
    }
  }

  function invokeFunc(time: number): void {
    const args = lastArgs!;
    const context = lastThis!;
    lastArgs = lastThis = undefined; // Clear args and this after invocation
    lastInvokeTime = time;
    try {
      const result = callback.apply(context, args);
      
      if (result && typeof (result as any).then === 'function') {
        (result as Promise<TReturn>).then(
          (resolvedValue) => {
            lastResult = resolvedValue; // Store result for flush
            currentResolve?.(resolvedValue);
          },
          (error) => currentReject?.(error)
        ).finally(() => {
          currentPromise = currentResolve = currentReject = undefined;
        });
      } else {
        lastResult = result; // Store result for flush
        currentResolve?.(result);
        currentPromise = currentResolve = currentReject = undefined;
      }
    } catch (error) {
      currentReject?.(error);
      currentPromise = currentResolve = currentReject = undefined;
    }
  }

  function leadingEdge(time: number): void {
    lastInvokeTime = time;
    timerId = setTimeout(timerExpired, wait);
    if (resolvedOptions.maxWait) {
      maxTimerId = setTimeout(maxTimerExpired, resolvedOptions.maxWait);
    }
    if (resolvedOptions.leading) {
      invokeFunc(time);
    }
  }

  function trailingEdge(time: number): void {
    clearTimers();
    if (resolvedOptions.trailing && lastArgs) {
      invokeFunc(time);
    }
  }

  function timerExpired(): void {
    const time = Date.now();
    shouldInvoke(time) ? trailingEdge(time) : startTimer(remainingWait(time));
  }

  function maxTimerExpired(): void {
    invokeFunc(Date.now());
    clearTimers();
  }

  function shouldInvoke(time: number): boolean {
    return !lastCallTime || 
      (time - lastCallTime >= wait) ||
      (resolvedOptions.maxWait !== undefined && (time - lastInvokeTime) >= resolvedOptions.maxWait);
  }

  function remainingWait(time: number): number {
    const sinceLastCall = time - (lastCallTime ?? 0);
    const sinceLastInvoke = time - lastInvokeTime;
    return Math.min(wait - sinceLastCall, resolvedOptions.maxWait! - sinceLastInvoke);
  }

  function startTimer(wait: number): void {
    timerId = setTimeout(timerExpired, wait);
  }

  const debounced = function (this: TThis, ...args: TArgs): Promise<TReturn> {
    const time = Date.now();
    const invoking = shouldInvoke(time);

    // If there's an existing promise, reject it as it's superseded
    cancelPendingPromise("Superseded by subsequent call");

    // Create a new promise for the current invocation
    currentPromise = new Promise((resolve, reject) => {
      currentResolve = resolve;
      currentReject = reject;
    });

    lastArgs = args;
    lastThis = this; // Capture `this` context
    lastCallTime = time;

    if (invoking) {
      if (!timerId) {
        leadingEdge(lastCallTime);
      } else {
        // If leading is true and a timer is active, it means a leading call already happened.
        // We clear the timer and invoke immediately to reset the debounce period.
        // This behavior is common in some debounce implementations (e.g., Lodash when maxWait is present).
        // For simple leading-edge, the first call happens, then subsequent calls are ignored until `wait` passes.
        // If maxWait is present, it forces an invocation after maxWait.
        clearTimers();
        invokeFunc(time);
      }
    } else if (!timerId) {
      startTimer(wait);
    }

    return currentPromise;
  } as DebouncedFunction<TThis, TArgs, TReturn>;

  /**
   * Cancels the debounced function, preventing any pending invocations.
   * Any promises returned by previous calls to the debounced function will be rejected.
   */
  debounced.cancel = function (this: TThis): void {
    clearTimers();
    cancelPendingPromise("Cancelled");
    lastInvokeTime = 0;
    lastArgs = lastCallTime = undefined;
    lastResult = undefined;
  };

  /**
   * Immediately invokes the debounced function with the last arguments and `this` context
   * it was called with, if there's a pending invocation.
   * Clears any pending timers.
   * @returns The result of the immediate invocation, or `undefined` if there was no pending invocation.
   */
  debounced.flush = function (this: TThis): TReturn | undefined {
    if (timerId || maxTimerId) {
      invokeFunc(Date.now());
      clearTimers();
      return lastResult; // Return the stored result
    }
    return undefined;
  };

  /**
   * Checks if there is a pending debounced invocation.
   * @returns `true` if there is a pending invocation, `false` otherwise.
   */
  debounced.pending = function (this: TThis): boolean {
    return !!timerId || !!maxTimerId;
  };

  return debounced;
}
