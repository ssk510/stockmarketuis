### 1. Build our Angular app ###
# The node stage "builder"
FROM node:12-alpine as builder
ARG NG_ENV=production
# Copying package and package-lock json to working directory
COPY package*.json ./
# Install dependencies and make a folder
RUN npm ci && mkdir /app-ui && mv ./node_modules ./app-ui/
# Set working directory
WORKDIR /app-ui
# Copy all files from current directory to working dir in image
COPY . .
# Build the project and copy the files
RUN npm run build -- --configuration=$NG_ENV


#### 2. Deploy our Angular app to NGINX ###
# nginx state for serving content
FROM nginx:1.16.0-alpine as production
# Copy our default nginx config
COPY ./.docker/nginx.conf /etc/nginx/nginx.conf
# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*
# Copy static assets from builder stage
COPY --from=builder /app-ui/dist/estockmarketui /usr/share/nginx/html
WORKDIR /usr/share/nginx/html
# Permission
RUN chown root /usr/share/nginx/html/*
RUN chmod 755 /usr/share/nginx/html/*
# Expose in 80 port
EXPOSE 80
# Containers run nginx with global directives and daemon off
ENTRYPOINT ["nginx", "-g", "daemon off;"]
