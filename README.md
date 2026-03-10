# debounce-ts ⏱️

[![CI](https://github.com/AdametherzLab/debounce-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/AdametherzLab/debounce-ts/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Type-safe debouncing and throttling with Promise support for async workflows.

## ✨ Features

- ✅ **Awaitable** - Returns promises that resolve when execution completes
- ✅ **Cancellation** - Rejects pending promises when cancelled
- ✅ **Leading/Trailing** edge invocation control
- ✅ **Full TypeScript** support with strict type safety

## 📦 Installation

bash
# npm
npm install @adametherzlab/debounce-ts

# yarn
yarn add @adametherzlab/debounce-ts


## 💻 Usage


import { debounce, throttle } from '@adametherzlab/debounce-ts';

// Debounce with promise
const search = debounce(async (query: string) => {
  const results = await fetchResults(query);
  return results;
}, 300);

// Throttle with promise
const logger = throttle(console.log, 1000, { leading: true });

// Usage
async function handleSearch(input: string) {
  try {
    const results = await search(input);
    display(results);
  } catch (err) {
    if (err.message.includes('Superseded')) {
      // Handle superseded search
    }
  }
}

