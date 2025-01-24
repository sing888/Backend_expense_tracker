FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN node init_db.js
COPY . .
CMD ["npm", "start"]
