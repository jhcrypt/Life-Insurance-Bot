/**
 * Simple logger for insurance module
 */
export const logger = {
  info: (message: string, className: string, methodName: string) => {
    console.log(`[INFO] [${className}:${methodName}] ${message}`);
  },
  
  warn: (message: string, className: string, methodName: string) => {
    console.warn(`[WARN] [${className}:${methodName}] ${message}`);
  },
  
  error: (message: string, className: string, methodName: string, error?: Error) => {
    console.error(`[ERROR] [${className}:${methodName}] ${message}`, error || '');
  },
  
  debug: (message: string, className: string, methodName: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] [${className}:${methodName}] ${message}`);
    }
  }
};

import { format } from 'date-fns';

export enum LogLevel {
ERROR = 'ERROR',
WARN = 'WARN',
INFO = 'INFO',
DEBUG = 'DEBUG'
}

interface LogContext {
module: string;
submodule?: string;
action?: string;
environment: string;
}

interface LogEntry {
timestamp: string;
level: LogLevel;
message: string;
error?: Error;
context: LogContext;
data?: Record<string, unknown>;
}

class InsuranceLogger {
private environment: string;

constructor() {
    this.environment = process.env.NODE_ENV || 'development';
}

private createLogEntry(
    level: LogLevel,
    message: string,
    submodule?: string,
    action?: string,
    error?: Error,
    data?: Record<string, unknown>
): LogEntry {
    return {
    timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS'),
    level,
    message,
    error,
    context: {
        module: 'insurance',
        submodule,
        action,
        environment: this.environment
    },
    data
    };
}

private formatLogEntry(entry: LogEntry): string {
    const context = [
    entry.context.module,
    entry.context.submodule,
    entry.context.action
    ].filter(Boolean).join(':');

    let output = `[${entry.timestamp}] [${entry.level}] [${context}] ${entry.message}`;

    if (entry.error) {
    output += `\nError: ${entry.error.message}\nStack: ${entry.error.stack}`;
    }

    if (entry.data) {
    output += `\nData: ${JSON.stringify(entry.data, null, 2)}`;
    }

    return output;
}

private log(
    level: LogLevel,
    message: string,
    submodule?: string,
    action?: string,
    error?: Error,
    data?: Record<string, unknown>
): void {
    const entry = this.createLogEntry(level, message, submodule, action, error, data);

    // In production, don't log DEBUG level messages
    if (this.environment === 'production' && level === LogLevel.DEBUG) {
    return;
    }

    const formattedLog = this.formatLogEntry(entry);
    
    switch (level) {
    case LogLevel.ERROR:
        console.error(formattedLog);
        break;
    case LogLevel.WARN:
        console.warn(formattedLog);
        break;
    case LogLevel.INFO:
        console.info(formattedLog);
        break;
    case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
    }
}

error(message: string, submodule?: string, action?: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, submodule, action, error, data);
}

warn(message: string, submodule?: string, action?: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, submodule, action, undefined, data);
}

info(message: string, submodule?: string, action?: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, submodule, action, undefined, data);
}

debug(message: string, submodule?: string, action?: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, submodule, action, undefined, data);
}
}

// Export singleton instance
export const logger = new InsuranceLogger();

