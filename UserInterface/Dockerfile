FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build production
RUN npm run build

# Stage 2: Serve dengan Nginx
FROM nginx:stable-alpine

# Copy build output ke Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Config Nginx untuk React Router (SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]