type Level = "debug" | "info" | "warn" | "error";
type Meta = Record<string, unknown>;

function log(level: Level, message: string, meta?: Meta) {
  const entry = { level, message, ...meta, timestamp: new Date().toISOString() };
  const write = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  write(JSON.stringify(entry));
}

export const logger = {
  debug: (message: string, meta?: Meta) => log("debug", message, meta),
  info: (message: string, meta?: Meta) => log("info", message, meta),
  warn: (message: string, meta?: Meta) => log("warn", message, meta),
  error: (message: string, meta?: Meta) => log("error", message, meta),
};
