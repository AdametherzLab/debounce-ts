import { describe, it, expect, jest } from "bun:test";
import { debounce, throttle } from "../src/index.ts";
import type { DebouncedFunction, ThrottledFunction } from "../src/index.ts";

describe("debounce-ts public API", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("debounces with trailing edge execution by default", () => {
    const fn = jest.fn((x: number) => x * 2);
    const debounced: DebouncedFunction<typeof fn> = debounce(fn, 100);
    
    debounced(1);
    debounced(2);
    debounced(3);
    
    expect(fn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(100);
    
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(3);
  });

  it("executes on leading edge when leading option is enabled", () => {
    const fn = jest.fn((msg: string) => msg.toUpperCase());
    const debounced: DebouncedFunction<typeof fn> = debounce(fn, 100, { 
      leading: true, 
      trailing: false 
    });
    
    const result = debounced("hello");
    
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("hello");
    expect(result).toBe("HELLO");
    
    debounced("world");
    expect(fn).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancels pending debounced execution", () => {
    const fn = jest.fn(() => "completed");
    const debounced: DebouncedFunction<typeof fn> = debounce(fn, 100);
    
    debounced();
    expect(debounced.pending()).toBe(true);
    
    debounced.cancel();
    expect(debounced.pending()).toBe(false);
    
    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });

  it("flushes pending execution immediately and returns result", () => {
    const fn = jest.fn((a: number, b: number) => a + b);
    const debounced: DebouncedFunction<typeof fn> = debounce(fn, 100);
    
    debounced(10, 20);
    expect(fn).not.toHaveBeenCalled();
    
    const result = debounced.flush();
    
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(10, 20);
    expect(result).toBe(30);
    expect(debounced.pending()).toBe(false);
    
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throttles function execution to once per wait window", () => {
    const fn = jest.fn((x: number) => x);
    const throttled: ThrottledFunction<typeof fn> = throttle(fn, 100, { 
      leading: true, 
      trailing: false 
    });
    
    throttled(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(1);
    
    throttled(2);
    throttled(3);
    expect(fn).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    
    throttled(4);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(4);
  });
});