import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    onConsoleLog(log) {
      if (log.includes("Not implemented: Window's open() method")) return false;
    }
  }
});
