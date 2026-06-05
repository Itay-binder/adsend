FROM node:20-alpine

RUN apk add --no-cache python3 make g++ ffmpeg git

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY index.js .

RUN mkdir -p sessions

EXPOSE 3001

CMD ["node", "index.js"]
