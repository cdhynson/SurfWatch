FROM node:20

WORKDIR /app

# Copy only package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the React app
RUN npm run build

# Serve the build using a static file server
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]
