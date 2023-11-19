import { createLogger, format, transports } from 'winston';
// const myCustomLevels = {
//     levels : {
//         error: 0,
//         info: 1,
//         warn: 2,
//         debug: 3
//     },
//     colors: {
//             error: 'white redBG',
//             info: 'orange',
//             warn: 'blue',
//             debug: 'black'
//         }
//     }


export const logger = createLogger({
    level: 'info',
    // levels: myCustomLevels.levels,
    format: format.combine(
        format.timestamp({
            format: 'DD.MM.YYYY HH:mm:ss'
        }),
        // format.colorize(),
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
      new transports.File({ filename: './logs/error_LevelLogs.log', level: 'error' }),
      new transports.File({ filename: './logs/info_LevelLogs.log' })
    ]
  });
