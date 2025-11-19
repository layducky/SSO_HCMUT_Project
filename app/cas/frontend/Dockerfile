FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Install simple HTTP server
RUN npm install -g http-server

EXPOSE 3002

CMD ["http-server", ".", "-p", "3002", "-a", "0.0.0.0", "--cors"]