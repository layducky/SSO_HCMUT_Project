FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY index.html ./

RUN npm install && npm run build

EXPOSE 3001
CMD ["npm", "run", "start"]
