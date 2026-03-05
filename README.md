[![CI](https://github.com/AdametherzLab/debounce-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/AdametherzLab/debounce-ts/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# debounce-ts ⏱️

## ✨ Features

- ✅ **Leading & trailing edge** invocation control (mix and match!)
- ✅ **Cancel and flush** methods on every returned function
- ✅ **Full TypeScript generics** support (preserves argument and return types)
- ✅ **Zero dependencies** — works in Node.js 20+, Bun, and modern browsers
- ✅ **Strict TypeScript** with comprehensive JSDoc for IntelliSense perfection

## 📦 Installation

```bash
# npm
npm install @adametherzlab/debounce-ts

# yarn
yarn add @adametherzlab/debounce-ts

# pnpm
pnpm add @adametherzlab/debounce-ts

# bun
bun add @adametherzlab/debounce-ts
```

## 🚀 Quick Start

```typescript
// REMOVED external import: import { debounce, throttle } from '@adametherzlab/debounce-ts';

// Debounce: wait for typing to stop
const saveDraft = debounce((content: string): void => {
  console.log(`Saving: ${content}`);
}, 500);

saveDraft('Hello');      // nothing yet
saveDraft('Hello world'); // waits... then logs after 500ms of silence

// Throttle: limit to once per 100ms
const updatePosition = throttle((x: number, y: number): string => {
  return `Position: ${x}, ${y}`;
}, 100, { leading: true, trailing: false });

const result = updatePosition(10, 20); // returns immediately
console.log(result); // "Position: 10, 20"
```

## 📚 API Reference

### `debounce<TArgs, TReturn>`

```typescript
function debounce<TArgs extends readonly unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  wait: number,
  options?: DebounceOptions
): DebouncedFunction<TArgs, TReturn>
```

**Parameters:**
- `callback` — The function to debounce
- `wait` — Milliseconds to delay (must be non-negative)
- `options` — Configuration object (see below)

**Throws:**
- `RangeError` — If wait is negative or maxWait is less than wait
- `Error` — If both leading and trailing are false

### `throttle<TArgs, TReturn>`

```typescript
function throttle<TArgs extends readonly unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  wait: number,
  options?: ThrottleOptions
): ThrottledFunction<TArgs, TReturn>
```

### Utility Functions

```typescript
// Safely clear any timer handle
clearTimer(handle: TimerHandle | null | undefined): void

// Check if a timer is currently active
isTimerActive(handle: TimerHandle | null | undefined): boolean
```

### Configuration Options

#### `DebounceOptions`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `leading` | `boolean` | `false` | Invoke the function on the leading edge of the timeout |
| `trailing` | `boolean` | `true` | Invoke the function on the trailing edge of the timeout |
| `maxWait` | `number` | `undefined` | Maximum time to wait before forcing invocation (creates a throttle-like effect) |

#### `ThrottleOptions`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `leading` | `boolean` | `true` | Invoke on the leading edge of the interval |
| `trailing` | `boolean` | `true` | Invoke on the trailing edge if calls occurred during the wait |

### Returned Function Methods

Both `debounce` and `throttle` return enhanced functions with these methods:

```typescript
interface DebouncedFunction<TArgs, TReturn> {
  (...args: TArgs): TReturn | undefined;
  
  /** Cancel any pending invocation */
  cancel(): void;
  
  /** Immediately invoke the pending function if one exists */
  flush(): TReturn | undefined;
  
  /** Check if an invocation is currently scheduled */
  pending(): boolean;
}
```

## 🎯 Advanced Usage

### Resize Handler Pattern

```typescript
// REMOVED external import: import { debounce } from '@adametherzlab/debounce-ts';

const handleResize = debounce((entries: ResizeObserverEntry[]): void => {
  // Heavy layout calculation here
  const width = entries[0]?.contentRect.width;
  console.log(`New width: ${width}px`);
}, 250, { leading: false, trailing: true });

const observer = new ResizeObserver((entries) => handleResize(entries));
observer.observe(document.body);

// Cleanup on unmount
window.addEventListener('beforeunload', () => {
  handleResize.cancel();
  observer.disconnect();
});
```

### Scroll Event Throttling

```typescript
// REMOVED external import: import { throttle } from '@adametherzlab/debounce-ts';

const handleScroll = throttle((event: Event): void => {
  const target = event.target as HTMLElement;
  const scrollPercent = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
  
  // Update progress bar or infinite scroll trigger
  console.log(`Scrolled: ${scrollPercent.toFixed(1)}%`);
}, 16, { leading: true, trailing: false }); // ~60fps

window.addEventListener('scroll', handleScroll, { passive: true });

// Force immediate execution if needed
document.getElementById('jump-to-top')?.addEventListener('click', () => {
  handleScroll.flush(); // Process any pending scroll updates immediately
});
```

### Component Cleanup Pattern

```typescript
class SearchComponent {
  private debouncedSearch: DebouncedFunction<[string], Promise<void>>;
  
  constructor() {
    this.debouncedSearch = debounce(
      (query: string) => this.performSearch(query), 
      300
    );
  }
  
  onInput(value: string): void {
    this.debouncedSearch(value);
  }
  
  destroy(): void {
    this.debouncedSearch.cancel();
  }
}
```

## 🌍 Environment Compatibility

- **Node.js**: 20+ (ESM-only)
- **Bun**: Latest stable
- **Browsers**: Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- **TypeScript**: 5.0+ (strict mode recommended)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT (c) [AdametherzLab](https://github.com/AdametherzLab)