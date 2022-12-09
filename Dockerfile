FROM node:18.12.1-alpine3.15

WORKDIR /usr/app

COPY . .

RUN npm install
RUN npm prune --production

EXPOSE 3000

CMD ["node", "src/index.mjs"]
