/**
 * Simple rate limiter to ensure a function is not called more than once every `ms` milliseconds.
 *
 * @param ms - milliseconds to wait between calls
 * @returns
 *
 * @example
 * const limiter = rateLimit(1000); // 1 second
 * if (limiter.canRun()) {
 *   // Do something
 *   limiter.reset(); // Optional, to reset the timer
 * } else {
 *   // Too soon, try again later
 * }
 */
export const rateLimit = (ms: number) => {
  let last = 0;

  /**
   *
   * @returns True if the function can be run, false otherwise
   */
  const canRun = () => {
    const now = Date.now();
    if (last === 0 || now - last >= ms) {
      return true;
    }
    return false;
  };

  /**
   * Reset the rate limiter
   */
  const reset = () => {
    last = Date.now();
  };

  return { canRun, reset };
};
