const ts = (): string => new Date().toISOString();

export const logger = {
  info:  (msg: string, ...args: unknown[]): void => console.log(`[INFO]  ${ts()} ${msg}`, ...args),
  warn:  (msg: string, ...args: unknown[]): void => console.warn(`[WARN]  ${ts()} ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]): void => console.error(`[ERROR] ${ts()} ${msg}`, ...args),
};
