# debounce-ts ⏱️

[![CI](https://github.com/AdametherzLab/debounce-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/AdametherzLab/debounce-ts/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Type-safe debouncing and throttling utilities for TypeScript with full support for typed `this` contexts.

## ✨ Features

- ✅ **Type-safe `this` context** — Preserve and type the `this` context of your callbacks
- ✅ **Leading & trailing edge** invocation control (mix and match!)
- ✅ **Cancel and flush** methods on every returned function
- ✅ **Full TypeScript generics** support (preserves argument and return types)
- ✅ **Zero dependencies** — works in Node.js 20+, Bun, and modern browsers
- ✅ **Strict TypeScript** with comprehensive JSDoc for IntelliSense perfection

## 📦 Installation

bash
# npm
npm install @adametherzlab/debounce-ts

# yarn
yarn add @adametherzlab/debounce-ts

# pnpm
pnpm add @adametherzlab/debounce-ts

# bun
bun add @adametherzlab/debounce-ts


## 🚀 Quick Start


import { debounce, throttle } from "@adametherzlab/debounce-ts";

// Basic debouncing
const debounced = debounce((x: string) => console.log(x), 100);
debounced("a");
debounced("b"); // Only "b" will be logged after 100ms

// With type-safe this context
class Counter {
  value = 0;
  increment() {
    this.value++;
    console.log(this.value);
  }
}

const counter = new Counter();
const debouncedInc = debounce(counter.increment, 100);

// TypeScript knows the 'this' context should be Counter
debouncedInc.call(counter);

// Cancel pending execution
debouncedInc.cancel();

// Check if execution is pending
if (debouncedInc.pending()) {
  debouncedInc.flush(); // Execute immediately
}

// Throttling with leading edge
const throttled = throttle((x: number) => console.log(x), 100, { 
  leading: true, 
  trailing: false 
});
throttled(1); // logs immediately
throttled(2); // ignored
throttled(3); // ignored
// after 100ms, can call again


## 📖 API Reference

### `debounce<TThis, TArgs, TReturn>(callback, wait, options?)`

Creates a debounced function that delays invoking `callback` until after `wait` milliseconds have elapsed since the last invocation.

**Type Parameters:**
- `TThis` — The type of `this` context in the callback
- `TArgs` — Tuple type of arguments
- `TReturn` — Return type of the callback

**Options:**
- `leading?: boolean` — Invoke on the leading edge (default: `false`)
- `trailing?: boolean` — Invoke on the trailing edge (default: `true`)
- `maxWait?: number` — Maximum time to wait before invoking

**Returns:** `DebouncedFunction<TThis, TArgs, TReturn>`

### `throttle<TThis, TArgs, TReturn>(callback, wait, options?)`

Creates a throttled function that only invokes `callback` at most once per `wait` milliseconds.

**Options:**
- `leading?: boolean` — Invoke on the leading edge
- `trailing?: boolean` — Invoke on the trailing edge

## 📝 Type-Safe This Context

This library preserves the `this` context type from your original function:


class Logger {
  prefix = "[LOG]";
  log(msg: string) {
    console.log(`${this.prefix} ${msg}`);
  }
}

const logger = new Logger();
const debouncedLog = debounce(logger.log, 100);

// TypeScript enforces correct 'this' context
debouncedLog.call(logger, "Hello"); // ✓ Valid
debouncedLog("Hello"); // ✗ Error: 'this' context required


## 🧪 Testing

bash
bun test


## 📄 License

MIT © AdametherzLab
