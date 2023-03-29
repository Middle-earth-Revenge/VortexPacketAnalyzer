FROM node:alpine as BUILD_IMAGE

WORKDIR /usr/src/app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/client/package.json ./packages/client/

RUN yarn workspaces focus client

COPY . .

RUN yarn workspace client build

FROM nginx

WORKDIR /usr/share/nginx/html

COPY --from=BUILD_IMAGE /usr/src/app/packages/client/dist .
