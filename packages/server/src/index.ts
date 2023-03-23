/* eslint-disable no-bitwise */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
import * as Hapi from '@hapi/hapi';
import HapiInert from '@hapi/inert';
import HapiPino from 'hapi-pino';
import {
  writeFile, access, constants,
} from 'fs/promises';
import path from 'path';

function isError(error: any): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

const __dirname = new URL('.', import.meta.url).pathname;

const JSON_STORE = path.resolve(__dirname, 'store.json');

async function main() {
  try {
    await access(JSON_STORE, constants.R_OK | constants.W_OK);
  } catch (err) {
    if (isError(err)) {
      if (err.code === 'ENOENT') {
        await writeFile(JSON_STORE, '[{}, {}]', { encoding: 'utf-8' });
      } else {
        throw err;
      }
    }
  }

  const server = Hapi.server({
    port: 8001,
    host: '0.0.0.0',
    routes: {
      cors: true,
    },
  });

  await server.register({
    plugin: HapiPino,
    options: {
      ...(process.env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
        },
      }),
    },
  });

  await server.register({
    plugin: HapiInert,
  });

  server.route({
    method: 'GET',
    path: '/load',
    handler: (request, h) => h.file(JSON_STORE),
  });

  server.route({
    method: 'POST',
    path: '/save',
    handler: async (request, h) => {
      await writeFile(JSON_STORE, JSON.stringify(request.payload), { encoding: 'utf-8' });

      return h.file(JSON_STORE);
    },
  });

  await server.start();
}

process.on('unhandledRejection', (err) => {
  console.error(err);

  process.exit(1);
});

main();
