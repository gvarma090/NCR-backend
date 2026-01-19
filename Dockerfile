FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

# 🔥 COPY EVERYTHING (INCLUDING admin/)
COPY . .

EXPOSE 4000
CMD ["node", "server.js"]

