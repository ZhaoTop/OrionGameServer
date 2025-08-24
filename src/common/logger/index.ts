import winston from 'winston';
import { loggerConfig } from '@/common/config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    const serviceStr = service ? `[${service}]` : '';
    return `${timestamp} ${level} ${serviceStr} ${message} ${metaStr}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

if (loggerConfig.filePath) {
  transports.push(
    new winston.transports.File({
      filename: `${loggerConfig.filePath}/error.log`,
      level: 'error',
      format: logFormat,
      maxsize: loggerConfig.maxSize ? parseSize(loggerConfig.maxSize) : undefined,
      maxFiles: loggerConfig.maxFiles,
    }),
    new winston.transports.File({
      filename: `${loggerConfig.filePath}/combined.log`,
      format: logFormat,
      maxsize: loggerConfig.maxSize ? parseSize(loggerConfig.maxSize) : undefined,
      maxFiles: loggerConfig.maxFiles,
    })
  );
}

function parseSize(size: string): number {
  const match = size.match(/^(\d+)([kmg])?$/i);
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }

  const num = parseInt(match[1], 10);
  const unit = (match[2] || '').toLowerCase();

  switch (unit) {
    case 'k':
      return num * 1024;
    case 'm':
      return num * 1024 * 1024;
    case 'g':
      return num * 1024 * 1024 * 1024;
    default:
      return num;
  }
}

export const logger = winston.createLogger({
  level: loggerConfig.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

export const createServiceLogger = (serviceName: string): winston.Logger => {
  return logger.child({ service: serviceName });
};