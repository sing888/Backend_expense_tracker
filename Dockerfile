# Use the Node.js 20 slim image
FROM node:20-slim

# Install build tools required for sqlite3
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Initialize the database
RUN node init_db.js

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
