const logMethod = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
} as const;

const buildPrefix = (feature: string, level: string) =>
  `[${new Date().toISOString()}] [${feature}] [${level}]`;

type Logger = {
  [K in keyof typeof logMethod]: (...messages: unknown[]) => void;
};

/**
 * Every line is prefixed with `[feature]` so logs can be filtered by feature name.
 */
export const createLogger = (feature: string): Logger => {
  return Object.fromEntries(
    Object.entries(logMethod).map(([method, level]) => [
      method,
      (...messages: unknown[]) =>
        console[method as keyof Logger](
          buildPrefix(feature, level),
          ...messages
        ),
    ])
  ) as Logger;
};
