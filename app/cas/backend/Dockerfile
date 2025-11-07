FROM node:18-alpine

# Cài đặt curl cho healthcheck
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "start"]