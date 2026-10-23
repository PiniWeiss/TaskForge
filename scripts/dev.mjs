// `npm run dev`: starts the API (watch mode) and the Vite client together, with prefixed output.
// When either process exits, or on Ctrl+C, both are stopped.

import { spawn, spawnSync } from 'node:child_process';

const processes = [
  { name: 'api', script: 'dev:api', color: '\x1b[33m' },
  { name: 'web', script: 'dev:client', color: '\x1b[36m' },
];

const reset = '\x1b[0m';
const children = [];
let stopping = false;

function prefix(name, color, chunk) {
  const lines = chunk.toString().split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  return lines.map((line) => `${color}[${name}]${reset} ${line}\n`).join('');
}

function stopAll(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null || child.pid === undefined) continue;
    // npm runs scripts through a shell; on Windows only taskkill /T reaches the real node process.
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
  process.exitCode = code;
}

for (const { name, script, color } of processes) {
  const child = spawn('npm', ['run', '--silent', script], {
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  child.stdout.on('data', (chunk) => process.stdout.write(prefix(name, color, chunk)));
  child.stderr.on('data', (chunk) => process.stderr.write(prefix(name, color, chunk)));
  child.on('exit', (code) => {
    if (!stopping) {
      process.stderr.write(`${color}[${name}]${reset} exited with code ${String(code)}\n`);
    }
    stopAll(code ?? 1);
  });
  children.push(child);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => stopAll(0));
}
