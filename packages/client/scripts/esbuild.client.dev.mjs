import * as esbuild from 'esbuild';
import { createServer, request } from 'http';
import browserslist from 'browserslist';
import { resolveToEsbuildTarget } from 'esbuild-plugin-browserslist';
import { sassPlugin } from 'esbuild-sass-plugin';

const target = resolveToEsbuildTarget(browserslist('defaults'), {
  printUnknownTargets: false,
});

const ctx = await esbuild.context({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outfile: 'dist/index.js',
  jsx: 'automatic',
  jsxDev: true,
  define: {
    'process.env.NODE_ENV': '"development"',
  },
  sourcemap: true,
  loader: {
    '.tsx': 'tsx',
  },
  target,
  plugins: [sassPlugin()],
});

const { host, port } = await ctx.serve({
  servedir: 'dist',
  port: 3000,
});

createServer((req, res) => {
  let reqPath = req.url;

  if (!reqPath.match(/\.\w+/)) {
    reqPath = '/';
  }

  const options = {
    hostname: host,
    port,
    path: reqPath,
    method: req.method,
    headers: req.headers,
  };

  // Forward each incoming request to esbuild
  const proxyReq = request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  // Forward the body of the request to esbuild
  req.pipe(proxyReq, { end: true });
}).listen(8000);

console.log(`Listening on ${host}:8000`);
