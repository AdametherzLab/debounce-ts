import { describe, it, expect, jest, beforeEach, afterEach } from "bun:test";
import { debounce, throttle } from "../src/index.ts";
import type { DebouncedFunction, ThrottledFunction } from "../src/index.ts";

describe("Promise-based Debounce/Throttle", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  describe("debounce", () => {
    it("should resolve last promise when trailing", async () => {
      const fn = jest.fn((n: number) => n * 2);
      const d = debounce(fn, 100);

      const p1 = d(1);
      const p2 = d(2);
      jest.advanceTimersByTime(100);

      await expect(p1).rejects.toThrow("Superseded");
      await expect(p2).resolves.toBe(4);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should resolve immediately when leading", async () => {
      const fn = jest.fn((s: string) => s.toUpperCase());
      const d = debounce(fn, 100, { leading: true });

      const p = d("test");
      await expect(p).resolves.toBe("TEST");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should reject when cancelled", async () => {
      const d = debounce((n: number) => n, 100);
      const p = d(10);
      d.cancel();
      await expect(p).rejects.toThrow("Cancelled");
    });
  });

  describe("throttle", () => {
    it("should resolve first and last promise", async () => {
      const fn = jest.fn((n: number) => n);
      const t = throttle(fn, 100, { leading: true, trailing: true });

      const p1 = t(1);
      const p2 = t(2);
      jest.advanceTimersByTime(100);

      await expect(p1).resolves.toBe(1);
      await expect(p2).resolves.toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should queue trailing resolution", async () => {
      const fn = jest.fn();
      const t = throttle(fn, 100, { trailing: true });

      t(1);
      const p2 = t(2);
      jest.advanceTimersByTime(100);

      await p2;
      expect(fn).toHaveBeenCalledWith(2);
    });

    it("should reject superseded promises", async () => {
      const t = throttle((n: number) => n, 100);
      const p1 = t(1);
      const p2 = t(2);
      jest.advanceTimersByTime(50);
      const p3 = t(3);
      jest.advanceTimersByTime(100);

      await expect(p1).rejects.toThrow("Superseded");
      await expect(p2).rejects.toThrow("Superseded");
      await expect(p3).resolves.toBe(3);
    });
  });
});
