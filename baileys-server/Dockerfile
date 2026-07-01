FROM node:22-alpine

RUN apk add --no-cache python3 make g++ ffmpeg git

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY index.js flow.js meta-api.js parse-intent.js email.js adigobudget.js adigoperf.js adigoadmin.js ./

RUN mkdir -p sessions

EXPOSE 3001

CMD ["node", "index.js"]
