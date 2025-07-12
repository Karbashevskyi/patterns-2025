const COLORS = {
  warning: '\x1b[1;33m',
  error: '\x1b[0;31m',
  info: '\x1b[1;37m',
} as const;

type LogLevel = keyof typeof COLORS;
type LoggerOptions = { level: LogLevel } | { color: string };

const logger = (options: LoggerOptions) => {
  const color = 'level' in options ? COLORS[options.level] : options.color;
  return (message: string) => {
    const date = new Date().toISOString();
    console.log(`${color}${date}\t${message}`);
  };
};

// Usage examples
const warning = logger({ level: 'warning' });
warning('Hello warning');

const error = logger({ color: '\x1b[0;31m' });
error('Hello error');

const info = logger({ level: 'info' });
info('Hello info');