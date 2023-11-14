import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'DD.MM.YYYY HH:mm:ss'
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
        format.printf(info => `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message} - ${JSON.stringify(info.reason)}`)
            ),
    defaultMeta: { service: 'pa-backend' },
    transports: [
      //
      // - Write to all logs with level `info` and below to `quick-start-combined.log`.
      // - Write all logs error (and below) to `quick-start-error.log`.
      //
      new transports.File({ filename: 'quick-star-error.log', level: 'error' }),
      new transports.File({ filename: 'quick-start-combined.log' })
    ]
  });
