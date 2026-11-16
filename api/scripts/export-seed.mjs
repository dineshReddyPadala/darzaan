import { build } from 'esbuild';
import { writeFileSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const outfile = path.resolve('scripts/export-bundle.cjs');
await build({
  entryPoints: [path.resolve('scripts/export-entry.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  outfile,
  plugins: [
    {
      name: 'stub-roles',
      setup(build) {
        build.onResolve({ filter: /utils[\\/]roles$/ }, () => ({ path: path.resolve('scripts/roles-stub.ts') }));
      },
    },
  ],
});
const loaded = await import(pathToFileURL(outfile).href);
void loaded;
writeFileSync(path.resolve('scripts/.export-ok'), 'ok');
