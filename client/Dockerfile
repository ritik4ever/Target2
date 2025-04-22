# Build stage
FROM node:16-alpine as build

# Set the working directory in the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

RUN npm install

# Copy the rest of the application code
COPY . .

# Build the production-ready client (assuming you have a build script)
RUN npm run build

# Production stage (Nginx to serve the app)
FROM nginx:alpine

# Copy the built client app from the build stage to Nginx's default directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy a custom Nginx configuration file (ensure you have one in your client folder)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx container
EXPOSE 80

# Start Nginx and keep it running in the foreground
CMD ["nginx", "-g", "daemon off;"]
