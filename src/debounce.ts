import type { DebounceOptions, TimerHandle, DebouncedFunction } from "./types.js";

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
  let currentResolve: (value: TReturn) => void;
  let currentReject: (reason?: any) => void;

  function clearTimers() {
    clearTimeout(timerId);
    clearTimeout(maxTimerId);
    timerId = maxTimerId = undefined;
  }

  function cancelPendingPromise(reason: string) {
    if (currentReject) {
      currentReject(new Error(reason));
      currentPromise = currentResolve = currentReject = undefined;
    }
  }

  function invokeFunc(time: number) {
    const args = lastArgs!;
    const context = lastThis!;
    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    try {
      const result = callback.apply(context, args);
      
      if (result && typeof result.then === 'function') {
        result.then(
          (resolvedValue) => currentResolve?.(resolvedValue),
          (error) => currentReject?.(error)
        ).finally(() => {
          currentPromise = currentResolve = currentReject = undefined;
        });
      } else {
        currentResolve?.(result);
        currentPromise = currentResolve = currentReject = undefined;
      }
    } catch (error) {
      currentReject?.(error);
      currentPromise = currentResolve = currentReject = undefined;
    }
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timerId = setTimeout(timerExpired, wait);
    if (resolvedOptions.maxWait) {
      maxTimerId = setTimeout(maxTimerExpired, resolvedOptions.maxWait);
    }
    if (resolvedOptions.leading) {
      invokeFunc(time);
    }
  }

  function trailingEdge(time: number) {
    clearTimers();
    if (resolvedOptions.trailing && lastArgs) {
      invokeFunc(time);
    }
  }

  function timerExpired() {
    const time = Date.now();
    shouldInvoke(time) ? trailingEdge(time) : startTimer(remainingWait(time));
  }

  function maxTimerExpired() {
    invokeFunc(Date.now());
    clearTimers();
  }

  function shouldInvoke(time: number) {
    return !lastCallTime || 
      (time - lastCallTime >= wait) ||
      (resolvedOptions.maxWait !== undefined && (time - lastInvokeTime) >= resolvedOptions.maxWait);
  }

  function remainingWait(time: number) {
    const sinceLastCall = time - (lastCallTime ?? 0);
    const sinceLastInvoke = time - lastInvokeTime;
    return Math.min(wait - sinceLastCall, resolvedOptions.maxWait! - sinceLastInvoke);
  }

  function startTimer(wait: number) {
    timerId = setTimeout(timerExpired, wait);
  }

  function debounced(this: TThis, ...args: TArgs): Promise<TReturn> {
    const time = Date.now();
    const invoking = shouldInvoke(time);

    cancelPendingPromise("Superseded by subsequent call");
    currentPromise = new Promise((resolve, reject) => {
      currentResolve = resolve;
      currentReject = reject;
    });

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (invoking) {
      if (!timerId) leadingEdge(lastCallTime);
      else {
        clearTimers();
        invokeFunc(time);
      }
    } else if (!timerId) {
      startTimer(wait);
    }

    return currentPromise;
  }

  debounced.cancel = () => {
    clearTimers();
    cancelPendingPromise("Cancelled");
    lastInvokeTime = 0;
    lastArgs = lastCallTime = undefined;
  };

  debounced.flush = () => {
    if (timerId || maxTimerId) {
      invokeFunc(Date.now());
      clearTimers();
    }
    return undefined;
  };

  debounced.pending = () => !!timerId || !!maxTimerId;

  return debounced as DebouncedFunction<TThis, TArgs, TReturn>;
}
