FROM node:20-alpine

WORKDIR /app

COPY games/whopixels/package.json ./
RUN npm install --production

COPY games/whopixels/ ./

ENV PORT=5100
EXPOSE 5100

CMD ["node", "server.js"]
