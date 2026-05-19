#!/usr/bin/env node
import { run } from '../src/index.js';

run().catch((err) => {
  console.error('\n[create-openclaw-setup] 意外错误:', err.message);
  process.exit(1);
});
