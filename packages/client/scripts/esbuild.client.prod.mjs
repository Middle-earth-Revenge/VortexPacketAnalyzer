import * as esbuild from 'esbuild';
import browserslist from 'browserslist';
import { resolveToEsbuildTarget } from 'esbuild-plugin-browserslist';
import { sassPlugin } from 'esbuild-sass-plugin';

const target = resolveToEsbuildTarget(browserslist('defaults'), {
  printUnknownTargets: false,
});

await esbuild.build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outfile: 'dist/index.js',
  jsx: 'automatic',
  jsxDev: false,
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  sourcemap: true,
  loader: {
    '.tsx': 'tsx',
  },
  target,
  plugins: [sassPlugin()],
});
