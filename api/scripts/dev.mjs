import { spawn } from 'node:child_process';
import { loadLocalEnv } from './load-env.mjs';

loadLocalEnv();

const names = ['api-gateway', 'auth-service', 'core-service', 'notification-service', 'worker'];
const children = names.map((name) => spawn('npx', ['nest', 'start', name, '--watch'], { stdio: 'inherit', shell: true }));
const stop = () => {
  for (const child of children) child.kill();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
