import { cp, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { port: { type: 'string', default: '3100' } } });
const standalone = resolve('.next/standalone');
await cp(resolve('.next/static'), resolve(standalone, '.next/static'), { recursive: true });
try {
  await access('public');
  await cp(resolve('public'), resolve(standalone, 'public'), { recursive: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const server = spawn(process.execPath, [resolve(standalone, 'server.js')], {
  stdio: 'inherit',
  env: { ...process.env, PORT: values.port, HOSTNAME: '127.0.0.1' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('exit', (code) => process.exit(code ?? 1));
server.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
