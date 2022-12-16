FROM node:14.16.1-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json /app/

RUN npm install --production

COPY . .

ENV PORT=3000

EXPOSE ${PORT}

CMD [ "node", "src/server/index.js" ]
