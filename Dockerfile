FROM node:20-slim

# Install build tools for native modules (like sqlite3)
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY init_db.js ./
COPY expense_tracker.db ./
COPY db.js ./

# Install all dependencies, including native ones like sqlite3
RUN apk add --no-cache --update musl-dev && \
    npm install

# Copy the application code, including init_db.js
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
