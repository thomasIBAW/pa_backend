import { createLogger, format, transports, addColors } from 'winston';
import 'winston-daily-rotate-file';  // If you want to use daily rotating file transport
import path from 'path'
import callsite from 'callsites';


const backend = process.env.BACKEND || "unknown"  //to be set in Env variables
const loglevel = process.env.LOG_LEVEL || "info"  //to be set in Env variables
const consolelevel = process.env.CONS_LOG_LEVEL || "info"  //to be set in Env variables


const myCustomLevels = {
    levels : {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3
    },
    colors: {
            error: 'bold red',
            warn: 'orange',
            info: 'blue',
            debug: 'gray'
        }
    }

    addColors(myCustomLevels.colors);

// Custom format function to extract filename and line number
const addFileAndLine = format((info) => {
  const stack = callsite();

    // Find the first frame that is outside the logging library itself and this current file
    const frame = stack.find((frame) => {
        const filename = frame.getFileName();
        return filename && !filename.includes('node_modules') && filename !== "loggers.js";
    });
  if (frame) {
      info.file = path.relative(process.cwd(), frame.getFileName());
      info.line = frame.getLineNumber();
  }
  return info;
});


  //   const customFormat = format.printf(({ timestamp, level, message, ...meta }) => {
  //     let metaString = '';
  //     if (Object.keys(meta).length) {
  //         metaString = ` - ${stringify(meta, { maxLength: 100 })}`;
  //     }
  //     return `${timestamp} ${level}: ${message}${metaString}`;
  // });
  
export const logger = createLogger({
    // level: 'info',
    levels: myCustomLevels.levels,
    format: format.combine(
        format.timestamp({
            format: 'DD.MM.YYYY HH:mm:ss'
        }),
        format.errors({ stack: true }),
        format.splat(),
        //format.json(),
        // format.printf(info => `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message} - ${JSON.stringify(info.reason)}`)
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} - ${level} - ${message} - ${meta && Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
      })
        
        ),
    defaultMeta: { S: 'backend', V: backend },
    transports: [
      new transports.File({ filename: './logs/error_LevelLogs.log', level: 'error' }),
      new transports.File({ filename: './logs/info_LevelLogs.log', level: loglevel }),

      // Optionally add console transport
      new transports.Console({
            format: format.combine(
                format.colorize(),
                addFileAndLine(),
                format.printf(({ timestamp, level, message, file, line, ...meta }) => {
                    return `${level} - ${message} - ${meta && Object.keys(meta).length ? JSON.stringify(meta) : ''} `
                    // return `${level} - ${message} - ${meta && Object.keys(meta).length ? JSON.stringify(meta) : ''} [${file}:${line}]`
                }) 
            )
            , level:consolelevel
        })
    ]
  });

  // Optionally, if you want to use a daily rotate file transport
new transports.DailyRotateFile({
    filename: './logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
})