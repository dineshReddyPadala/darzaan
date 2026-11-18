import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveEnvPath() {
  const name = process.env.DARZAAN_ENV ?? 'development';
  const scoped = path.join(apiRoot, `.env.${name}`);
  if (existsSync(scoped)) return scoped;
  const legacy = path.join(apiRoot, '.env');
  if (existsSync(legacy)) return legacy;
  return null;
}

export function loadLocalEnv() {
  const envPath = resolveEnvPath();
  if (!envPath) return;
  process.loadEnvFile(envPath);
}