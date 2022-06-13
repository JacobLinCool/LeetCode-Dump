FROM node:lts-slim

COPY . ./leetcode-dump
RUN cd leetcode-dump && npx -y pnpm i -P

ENTRYPOINT [ "node", "/leetcode-dump/lib/leetcode-dump.js" ]
