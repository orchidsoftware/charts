import { afterAll, afterEach, beforeEach, vi } from "vitest";

const owned = vi.hoisted(() => ({ test: new Set(), suite: new Set(), inTest: false }));

vi.mock("../../src/core/Chart.js", async (importOriginal) => {
  const { default: Chart } = await importOriginal();
  return {
    default: class TrackedChart extends Chart {
      constructor(...args) {
        super(...args);
        (owned.inTest ? owned.test : owned.suite).add(this);
      }

      destroy() {
        super.destroy();
        owned.test.delete(this);
        owned.suite.delete(this);
      }
    },
  };
});

beforeEach(() => {
  owned.inTest = true;
});

afterEach(() => {
  for (const chart of owned.test) {
    chart.destroy();
  }
  owned.test.clear();
  owned.inTest = false;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterAll(() => {
  for (const chart of owned.suite) {
    chart.destroy();
  }
  owned.suite.clear();
});
