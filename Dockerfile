# Use the Node.js 20 image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Rebuild sqlite3 from source to ensure compatibility with the environment
RUN npm rebuild sqlite3 --build-from-source

# Copy the rest of the application code into the container
COPY . .

# Initialize the database
RUN node init_db.js

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
