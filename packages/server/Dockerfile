FROM node:alpine as BUILD_IMAGE

WORKDIR /usr/src/app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/server/package.json ./packages/server/

RUN yarn workspaces focus server

COPY . .

RUN yarn workspace server build

FROM node:alpine

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/packages/server/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules

EXPOSE 8001

CMD ["node", "./dist/index.mjs"]
