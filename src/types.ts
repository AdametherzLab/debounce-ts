/**
 * Configuration options for debouncing function calls.
 */
export interface DebounceOptions {
  /** Whether to invoke on the leading edge of the timeout. */
  readonly leading?: boolean;
  /** Whether to invoke on the trailing edge of the timeout. */
  readonly trailing?: boolean;
  /** The maximum time to wait before invoking, in milliseconds. */
  readonly maxWait?: number;
}

/**
 * Configuration options for throttling function calls.
 */
export interface ThrottleOptions {
  /** Whether to invoke on the leading edge of the interval. */
  readonly leading?: boolean;
  /** Whether to invoke on the trailing edge of the interval. */
  readonly trailing?: boolean;
}

/**
 * Handle type for timers, compatible with Node.js, Bun, and browser environments.
 */
export type TimerHandle = ReturnType<typeof setTimeout>;

/**
 * Generic callback function signature with typed `this` context.
 * @template TThis - Type of the `this` context within the function.
 * @template TArgs - Tuple type of function arguments
 * @template TReturn - Return type of the function
 */
export type GenericCallback<TThis, TArgs extends readonly unknown[], TReturn> = (
  this: TThis,
  ...args: TArgs
) => TReturn;

/**
 * A debounced function wrapping the original callable with scheduling control.
 * Preserves the `this` context type from the original function.
 * @template TThis - Type of the `this` context within the original function.
 * @template TArgs - Tuple type of the original function arguments
 * @template TReturn - Return type of the original function
 */
export interface DebouncedFunction<TThis, TArgs extends readonly unknown[], TReturn> {
  /**
   * Invoke the debounced function with the provided arguments.
   * The `this` context will be preserved from the call site.
   * @param args - Arguments to pass to the original function
   * @returns The result if invoked immediately, otherwise undefined
   */
  (this: TThis, ...args: TArgs): TReturn | undefined;

  /**
   * Cancel any pending debounced invocations.
   */
  cancel(): void;

  /**
   * Immediately invoke the pending call if one exists, clearing the timer.
   * @returns The result of the flushed invocation, or undefined if none pending
   */
  flush(): TReturn | undefined;

  /**
   * Check if an invocation is currently scheduled.
   * @returns True if a call is pending, false otherwise
   */
  pending(): boolean;
}

/**
 * A throttled function wrapping the original callable with rate-limiting control.
 * Preserves the `this` context type from the original function.
 * @template TThis - Type of the `this` context within the original function.
 * @template TArgs - Tuple type of the original function arguments
 * @template TReturn - Return type of the original function
 */
export interface ThrottledFunction<TThis, TArgs extends readonly unknown[], TReturn> {
  /**
   * Invoke the throttled function with the provided arguments.
   * The `this` context will be preserved from the call site.
   * @param args - Arguments to pass to the original function
   * @returns The result if invoked immediately, otherwise undefined
   */
  (this: TThis, ...args: TArgs): TReturn | undefined;

  /**
   * Cancel any pending throttled invocations.
   */
  cancel(): void;

  /**
   * Immediately invoke the pending call if one exists, clearing the timer.
   * @returns The result of the flushed invocation, or undefined if none pending
   */
  flush(): TReturn | undefined;

  /**
   * Check if an invocation is currently scheduled for the trailing edge.
   * @returns True if a call is pending, false otherwise
   */
  pending(): boolean;
}
