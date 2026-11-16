import { spawn } from 'node:child_process';
import { existsSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { loadLocalEnv } from './load-env.mjs';

loadLocalEnv();

const name = process.argv[2];
const generatedLink = path.resolve(`dist/apps/${name}/generated`);
const generatedTarget = path.resolve('generated');
if (existsSync(generatedTarget) && !existsSync(generatedLink)) {
  symlinkSync(generatedTarget, generatedLink, 'junction');
}
const candidates = [
  `dist/apps/${name}/apps/${name}/src/main.js`,
  `dist/apps/${name}/src/main.js`,
];
const entry = candidates.find((file) => existsSync(file));
if (!entry) {
  console.error(`Build output for ${name} was not found. Run npm run build.`);
  process.exit(1);
}
const child = spawn(process.execPath, [entry], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
