import { createLogger, format, transports } from 'winston';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  agentId?: string;
  [key: string]: unknown;
}

const logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logFormat = process.env.NODE_ENV === 'production'
  ? format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    )
  : format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.colorize(),
      format.printf(({ timestamp, level, message, ...meta }) => {
        const context = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${context}`;
      })
    );

const logger = createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'agentcore' },
  transports: [
    new transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

/**
 * Mask sensitive data in logs
 */
function maskSensitive(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  const masked = { ...data };

  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitive(masked[key] as Record<string, unknown>);
    }
  }

  return masked;
}

/**
 * Create a child logger with context
 */
export function createContextLogger(context: LogContext) {
  const maskedContext = maskSensitive(context as Record<string, unknown>);

  return {
    debug: (message: string, meta?: Record<string, unknown>) => 
      logger.debug(message, { ...maskedContext, ...meta ? maskSensitive(meta) : {} }),
    info: (message: string, meta?: Record<string, unknown>) => 
      logger.info(message, { ...maskedContext, ...meta ? maskSensitive(meta) : {} }),
    warn: (message: string, meta?: Record<string, unknown>) => 
      logger.warn(message, { ...maskedContext, ...meta ? maskSensitive(meta) : {} }),
    error: (message: string, meta?: Record<string, unknown> | Error) => {
      if (meta instanceof Error) {
        logger.error(message, { ...maskedContext, error: meta.message, stack: meta.stack });
      } else {
        logger.error(message, { ...maskedContext, ...meta ? maskSensitive(meta) : {} });
      }
    },
  };
}

export { logger };
export type { LogContext };
