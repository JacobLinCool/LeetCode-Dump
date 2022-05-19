FROM node:lts-slim

WORKDIR /usr/workspace
COPY . ./
RUN npm i -g pnpm && pnpm i -P

ENTRYPOINT [ "node", "./lib/leetcode-dump.js" ]
