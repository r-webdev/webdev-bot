export type Logger = {
  log: (...messages: unknown[]) => void;
  warn: (...messages: unknown[]) => void;
  error: (...messages: unknown[]) => void;
};

/**
 * Every line is prefixed with `[feature]` so logs can be filtered by feature name.
 */
export const createLogger = (feature: string): Logger => {
  const prefix = `[${feature}]`;

  return {
    log: (...messages) => console.log(prefix, ...messages),
    warn: (...messages) => console.warn(prefix, ...messages),
    error: (...messages) => console.error(prefix, ...messages),
  };
};
