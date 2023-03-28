import * as esbuild from 'esbuild';
import esbuildPluginPino from 'esbuild-plugin-pino';
import { nodeExternalsPlugin } from 'esbuild-node-externals';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outdir: 'dist/',
  outExtension: { '.js': '.mjs' },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  format: 'esm',
  target: 'node18',
  platform: 'node',
  plugins: [
    esbuildPluginPino({ transports: ['pino-pretty'] }),
    nodeExternalsPlugin(),
  ],
});
