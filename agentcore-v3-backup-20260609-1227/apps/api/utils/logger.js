const isDev = process.env.NODE_ENV === 'development';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  constructor(context = 'app') {
    this.context = context;
  }

  _log(level, ...args) {
    const timestamp = new Date().toISOString();
    const message = args.map(a => 
      typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)
    ).join(' ');

    // Always write errors to stderr
    if (level === 'error') {
      process.stderr.write(`[${timestamp}] [ERROR] [${this.context}] ${message}\n`);
      return;
    }

    // Only log debug/info in development
    if (!isDev && (level === 'debug' || level === 'info')) {
      return;
    }

    // In development, use console with colors
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'debug':
        console.debug(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  info(...args) { this._log('info', ...args); }
  error(...args) { this._log('error', ...args); }
  warn(...args) { this._log('warn', ...args); }
  debug(...args) { this._log('debug', ...args); }

  child(context) {
    return new Logger(`${this.context}:${context}`);
  }
}

const rootLogger = new Logger('agentcore');

module.exports = rootLogger;
module.exports.Logger = Logger;
