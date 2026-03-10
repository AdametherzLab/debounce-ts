export interface DebounceOptions {
  readonly leading?: boolean;
  readonly trailing?: boolean;
  readonly maxWait?: number;
}

export interface ThrottleOptions {
  readonly leading?: boolean;
  readonly trailing?: boolean;
}

export type TimerHandle = ReturnType<typeof setTimeout>;

export type GenericCallback<TThis, TArgs extends readonly unknown[], TReturn> = (
  this: TThis,
  ...args: TArgs
) => TReturn;

export interface DebouncedFunction<TThis, TArgs extends readonly unknown[], TReturn> {
  (this: TThis, ...args: TArgs): Promise<TReturn>;
  cancel(): void;
  flush(): TReturn | undefined;
  pending(): boolean;
}

export interface ThrottledFunction<TThis, TArgs extends readonly unknown[], TReturn> {
  (this: TThis, ...args: TArgs): Promise<TReturn>;
  cancel(): void;
  flush(): TReturn | undefined;
  pending(): boolean;
}
