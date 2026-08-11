import winston from 'winston';
const { combine, timestamp, printf, colorize, align } = winston.format;

const customFormat = printf(({ timestamp, level, message, ...meta }) => {
  const colorizer = colorize();
  const metaString =
    meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${colorizer.colorize(
    level,
    level,
  )}: ${message}${metaString}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD hh:mm:ss.SSS A',
    }),
    align(),
    customFormat,
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
