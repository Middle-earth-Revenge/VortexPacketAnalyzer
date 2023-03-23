import * as esbuild from 'esbuild';
import serve from '@es-exec/esbuild-plugin-serve';
import esbuildPluginPino from 'esbuild-plugin-pino';
import { nodeExternalsPlugin } from 'esbuild-node-externals';

const ctx = await esbuild.context({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outdir: 'dist/',
  outExtension: { '.js': '.mjs' },
  define: {
    'process.env.NODE_ENV': '"development"',
  },
  sourcemap: true,
  loader: {},
  format: 'esm',
  target: 'node18',
  platform: 'node',
  plugins: [
    serve({
      main: 'dist/index.mjs',
    }),
    esbuildPluginPino({ transports: ['pino-pretty'] }),
    nodeExternalsPlugin(),
  ],
});

await ctx.watch();
