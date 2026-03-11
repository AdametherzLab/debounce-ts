/**
 * Options for configuring the debounce behavior.
 */
export interface DebounceOptions {
  /**
   * Specify invoking on the leading edge of the timeout.
   * Defaults to `false`.
   */
  readonly leading?: boolean;
  /**
   * Specify invoking on the trailing edge of the timeout.
   * Defaults to `true`.
   */
  readonly trailing?: boolean;
  /**
   * The maximum time `callback` is allowed to be delayed before it's invoked.
   * If `maxWait` is provided, the debounced function will be invoked at most once
   * every `maxWait` milliseconds, ensuring it's not delayed indefinitely.
   * Must be greater than or equal to `wait`.
   */
  readonly maxWait?: number;
}

/**
 * Options for configuring the throttle behavior.
 */
export interface ThrottleOptions {
  /**
   * Specify invoking on the leading edge of the timeout.
   * Defaults to `false`.
   */
  readonly leading?: boolean;
  /**
   * Specify invoking on the trailing edge of the timeout.
   * Defaults to `true`.
   */
  readonly trailing?: boolean;
}

/**
 * Type alias for a timer handle returned by `setTimeout`.
 */
export type TimerHandle = ReturnType<typeof setTimeout>;

/**
 * A generic callback function type that preserves `this` context and argument types.
 * @template TThis - The type of `this` context for the function.
 * @template TArgs - A tuple type representing the arguments of the function.
 * @template TReturn - The return type of the function.
 */
export type GenericCallback<TThis, TArgs extends readonly unknown[], TReturn> = (
  this: TThis,
  ...args: TArgs
) => TReturn;

/**
 * Represents a debounced function with additional control methods.
 * @template TThis - The type of `this` context for the original function.
 * @template TArgs - A tuple type representing the arguments of the original function.
 * @template TReturn - The return type of the original function.
 */
export interface DebouncedFunction<TThis, TArgs extends readonly unknown[], TReturn> {
  /**
   * The debounced function itself. When called, it returns a Promise that resolves
   * with the original function's return value or rejects if superseded or cancelled.
   * The `this` context is correctly inferred and preserved from the call site.
   * @param args - The arguments to pass to the original function.
   * @returns A Promise that resolves with the original function's result.
   */
  (this: TThis, ...args: TArgs): Promise<TReturn>;
  /**
   * Cancels the debounced function, preventing any pending invocations.
   * Any promises returned by previous calls to the debounced function will be rejected.
   * The `this` context is correctly inferred and preserved.
   */
  cancel(this: TThis): void;
  /**
   * Immediately invokes the debounced function with the last arguments and `this` context
   * it was called with, if there's a pending invocation.
   * Clears any pending timers.
   * The `this` context is correctly inferred and preserved.
   * @returns The result of the immediate invocation, or `undefined` if there was no pending invocation.
   */
  flush(this: TThis): TReturn | undefined;
  /**
   * Checks if there is a pending debounced invocation.
   * The `this` context is correctly inferred and preserved.
   * @returns `true` if there is a pending invocation, `false` otherwise.
   */
  pending(this: TThis): boolean;
}

/**
 * Represents a throttled function with additional control methods.
 * It has the same interface as `DebouncedFunction` because throttle is implemented
 * using debounce with specific options.
 * @template TThis - The type of `this` context for the original function.
 * @template TArgs - A tuple type representing the arguments of the original function.
 * @template TReturn - The return type of the original function.
 */
export interface ThrottledFunction<TThis, TArgs extends readonly unknown[], TReturn> {
  /**
   * The throttled function itself. When called, it returns a Promise that resolves
   * with the original function's return value or rejects if superseded or cancelled.
   * The `this` context is correctly inferred and preserved from the call site.
   * @param args - The arguments to pass to the original function.
   * @returns A Promise that resolves with the original function's result.
   */
  (this: TThis, ...args: TArgs): Promise<TReturn>;
  /**
   * Cancels the throttled function, preventing any pending invocations.
   * Any promises returned by previous calls to the throttled function will be rejected.
   * The `this` context is correctly inferred and preserved.
   */
  cancel(this: TThis): void;
  /**
   * Immediately invokes the throttled function with the last arguments and `this` context
   * it was called with, if there's a pending invocation.
   * Clears any pending timers.
   * The `this` context is correctly inferred and preserved.
   * @returns The result of the immediate invocation, or `undefined` if there was no pending invocation.
   */
  flush(this: TThis): TReturn | undefined;
  /**
   * Checks if there is a pending throttled invocation.
   * The `this` context is correctly inferred and preserved.
   * @returns `true` if there is a pending invocation, `false` otherwise.
   */
  pending(this: TThis): boolean;
}
