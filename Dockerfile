# Node.js + Yarn
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production && npm cache clean --force;

COPY . .

EXPOSE 5000
CMD ["npm","start"]
