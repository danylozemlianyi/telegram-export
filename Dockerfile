FROM node:slim

WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
EXPOSE 3000
EXPOSE 5001

# Command to run your application
CMD ["npm", "run", "start"]
