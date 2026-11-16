import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');

export function loadLocalEnv() {
  if (!existsSync(envPath)) return;
  process.loadEnvFile(envPath);
}
