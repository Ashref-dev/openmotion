/**
 * Structured logging for render operations
 * Logs are stored in renderJobs table and streamed to clients
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  stage?: string;
  metadata?: Record<string, unknown>;
}

export class RenderLogger {
  private logs: LogEntry[] = [];
  private onLog?: (entry: LogEntry) => void;

  constructor(onLog?: (entry: LogEntry) => void) {
    this.onLog = onLog;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      metadata,
    };

    this.logs.push(entry);
    
    // Call callback if provided (for real-time streaming)
    if (this.onLog) {
      this.onLog(entry);
    }

    // Also log to console
    const prefix = `[${level.toUpperCase()}]`;
    const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
    console.log(`${prefix} ${message}${metaStr}`);
  }

  info(message: string, metadata?: Record<string, unknown>) {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>) {
    this.log("error", message, metadata);
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    this.log("debug", message, metadata);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  getLogsAsJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  clear() {
    this.logs = [];
  }
}
