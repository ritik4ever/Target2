FROM node:16-alpine

WORKDIR /app

# Copy just package files first (thanks to .dockerignore)
COPY package*.json ./

# Prevent peer-dep conflicts
RUN npm config set legacy-peer-deps true

# Install production deps
RUN npm install --production

# Now copy your app code
COPY src ./src

EXPOSE 3001
CMD ["node", "src/index.js"]
