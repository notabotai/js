const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  black: '\x1b[30m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
};

class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssertionError";
  }
}

type Literal = string | number | boolean | null | undefined | object;
export function assertEqual(observed: Literal, expected: Literal) {
  if (observed !== expected) {
    const message = `\n\n` +
      `\tobserved: ${colors.red}${observed}${colors.reset}\n` +
      `\texpected: ${colors.green}${expected}${colors.reset}\n`;
    throw new AssertionError(message);
  }
}

export function assert(expr: boolean, msg = "") {
  if (!expr) {
    throw new AssertionError(msg);
  }
}
