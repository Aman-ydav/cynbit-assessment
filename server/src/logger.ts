/** Minimal structured-ish logger. Silent under test so output stays readable. */
const silent = () => process.env.NODE_ENV === "test";
const stamp = () => new Date().toISOString();

export const log = {
  info: (...args: unknown[]) => {
    if (!silent()) console.log(stamp(), "INFO ", ...args);
  },
  warn: (...args: unknown[]) => {
    if (!silent()) console.warn(stamp(), "WARN ", ...args);
  },
  error: (...args: unknown[]) => {
    if (!silent()) console.error(stamp(), "ERROR", ...args);
  },
};
