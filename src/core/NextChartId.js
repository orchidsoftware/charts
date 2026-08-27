const chartIdSequence = { latest: 0 };

/**
 * Allocates a process-local identifier for linking chart-owned DOM nodes.
 *
 * @returns {number} Monotonically increasing identifier unique within the current module instance.
 */
export function nextChartId() {
  chartIdSequence.latest += 1;
  return chartIdSequence.latest;
}
