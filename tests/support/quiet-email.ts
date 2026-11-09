// Integration tests trigger real notification emails (to .test addresses), which development mode
// prints to the console. Drop those lines so test output stays readable.
const info = console.info.bind(console);
console.info = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('[email:dev]')) return;
  info(...args);
};
