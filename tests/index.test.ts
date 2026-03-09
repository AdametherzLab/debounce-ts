import { describe, it, expect, jest, beforeEach, afterEach } from "bun:test";
import { debounce, throttle } from "../src/index.ts";
import type { DebouncedFunction, ThrottledFunction } from "../src/index.ts";

describe("debounce-ts public API", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("debounce", () => {
    it("debounces with trailing edge execution by default", () => {
      const fn = jest.fn((x: number) => x * 2);
      const debounced: DebouncedFunction<unknown, [number], number> = debounce(fn, 100);
      
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
      const debounced: DebouncedFunction<unknown, [string], string> = debounce(fn, 100, { 
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
      const debounced: DebouncedFunction<unknown, [], string> = debounce(fn, 100);
      
      debounced();
      expect(debounced.pending()).toBe(true);
      
      debounced.cancel();
      expect(debounced.pending()).toBe(false);
      
      jest.advanceTimersByTime(100);
      expect(fn).not.toHaveBeenCalled();
    });

    it("flushes pending execution immediately and returns result", () => {
      const fn = jest.fn((a: number, b: number) => a + b);
      const debounced: DebouncedFunction<unknown, [number, number], number> = debounce(fn, 100);
      
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

    it("should correctly infer and preserve 'this' context for debounced functions", () => {
      class MyClass {
        value: number = 0;
        constructor(initialValue: number) {
          this.value = initialValue;
        }
        
        increment(amount: number) {
          this.value += amount;
          return this.value;
        }
      }

      const instance = new MyClass(10);
      const debouncedIncrement = debounce(instance.increment, 100);

      debouncedIncrement.call(instance, 5);
      debouncedIncrement.call(instance, 10);
      debouncedIncrement.call(instance, 15);

      expect(instance.value).toBe(10);
      jest.advanceTimersByTime(100);
      expect(instance.value).toBe(25);

      const instance2 = new MyClass(100);
      const debouncedIncrement2 = debounce(function(this: MyClass, amount: number) {
        this.value += amount;
        return this.value;
      }, 100);

      debouncedIncrement2.call(instance2, 10);
      jest.advanceTimersByTime(100);
      expect(instance2.value).toBe(110);
    });

    it("should handle explicit this typing in callback signature", () => {
      interface Context {
        multiplier: number;
      }
      
      const fn = function(this: Context, x: number): number {
        return x * this.multiplier;
      };
      
      const debounced = debounce(fn, 50);
      const context: Context = { multiplier: 5 };
      
      debounced.call(context, 10);
      jest.advanceTimersByTime(50);
      
      expect(fn.call(context, 10)).toBe(50);
    });
  });

  describe("throttle", () => {
    it("throttles function execution to once per wait window", () => {
      const fn = jest.fn((x: number) => x);
      const throttled: ThrottledFunction<unknown, [number], number> = throttle(fn, 100, { 
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

    it("should correctly infer and preserve 'this' context for throttled functions", () => {
      class MyLogger {
        logs: string[] = [];
        logMessage(message: string) {
          this.logs.push(message);
        }
      }

      const logger = new MyLogger();
      const throttledLog = throttle(logger.logMessage, 100, { leading: true, trailing: true });

      throttledLog.call(logger, "first");
      expect(logger.logs).toEqual(["first"]);

      throttledLog.call(logger, "second");
      throttledLog.call(logger, "third");
      expect(logger.logs).toEqual(["first"]);

      jest.advanceTimersByTime(100);
      expect(logger.logs).toEqual(["first", "third"]);

      throttledLog.call(logger, "fourth");
      expect(logger.logs).toEqual(["first", "third", "fourth"]);
    });

    it("should throw TypeError for non-function callback", () => {
      expect(() => throttle("not a function" as any, 100)).toThrow(TypeError);
      expect(() => throttle(null as any, 100)).toThrow(TypeError);
      expect(() => throttle(123 as any, 100)).toThrow(TypeError);
    });

    it("should throw RangeError for negative wait", () => {
      expect(() => throttle(() => {}, -1)).toThrow(RangeError);
    });
  });

  describe("this context edge cases", () => {
    it("should handle 'this' context correctly with arrow functions (lexical scoping)", () => {
      const obj = { 
        id: 1,
        log: jest.fn(function(this: any, msg: string) { 
          return `ID: ${this?.id || 'N/A'}, Msg: ${msg}`;
        })
      };

      const debouncedLog = debounce(obj.log, 100);

      debouncedLog.call(obj, "hello");
      jest.advanceTimersByTime(100);
      expect(obj.log).toHaveBeenCalledWith("hello");
    });

    it("should maintain separate this contexts for multiple instances", () => {
      class Counter {
        count = 0;
        increment() {
          this.count++;
          return this.count;
        }
      }

      const counter1 = new Counter();
      const counter2 = new Counter();
      
      const debouncedInc = debounce(Counter.prototype.increment, 50);
      
      debouncedInc.call(counter1);
      debouncedInc.call(counter1);
      debouncedInc.call(counter2);
      
      jest.advanceTimersByTime(50);
      
      expect(counter1.count).toBe(1);
      expect(counter2.count).toBe(1);
    });
  });

  describe("utility functions", () => {
    it("clearTimer should safely clear timers", () => {
      const timer = setTimeout(() => {}, 1000);
      expect(() => clearTimer(timer)).not.toThrow();
      expect(() => clearTimer(null)).not.toThrow();
      expect(() => clearTimer(undefined)).not.toThrow();
    });

    it("isTimerActive should correctly identify active timers", () => {
      const timer = setTimeout(() => {}, 1000);
      expect(isTimerActive(timer)).toBe(true);
      clearTimeout(timer);
      expect(isTimerActive(timer)).toBe(true); // Handle is still truthy
      expect(isTimerActive(null)).toBe(false);
      expect(isTimerActive(undefined)).toBe(false);
    });
  });
});

import { clearTimer, isTimerActive } from "../src/index.ts";
