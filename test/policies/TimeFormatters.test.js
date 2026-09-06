import { expect, it, vi } from "vitest";

it("reuses built-in date and duration formatters across rows and redraws", async () => {
  vi.resetModules();
  const OriginalDate = Intl.DateTimeFormat;
  const OriginalNumber = Intl.NumberFormat;
  // Intl factories support both calls and construction; arrow mocks do not.
  // eslint-disable-next-line prefer-arrow-callback
  const dates = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (...args) {
    return new OriginalDate(...args);
  });
  // eslint-disable-next-line prefer-arrow-callback
  const numbers = vi.spyOn(Intl, "NumberFormat").mockImplementation(function (...args) {
    return new OriginalNumber(...args);
  });
  try {
    const { formatTimesheetDate, formatTimesheetDuration, formatTimeTick } =
      await import("../../src/support/presentation/Time.js");
    dates.mockClear();
    numbers.mockClear();
    for (let row = 0; row < 100; row += 1) {
      expect(formatTimesheetDate(new Date("2026-01-01"))).toContain("Jan");
      expect(formatTimesheetDuration(3_600_000)).toContain("hour");
      expect(formatTimesheetDuration(86_400_000)).toContain("day");
      for (const span of [3_600_000, 7 * 86_400_000, 365 * 86_400_000, 10 * 365 * 86_400_000]) {
        expect(formatTimeTick(Date.parse("2026-01-01"), span)).toBeTypeOf("string");
      }
    }
    expect(dates).toHaveBeenCalledTimes(5);
    expect(numbers).toHaveBeenCalledTimes(2);
  } finally {
    dates.mockRestore();
    numbers.mockRestore();
  }
});
