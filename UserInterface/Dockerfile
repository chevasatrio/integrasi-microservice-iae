# ✅ FIX: Tambah ARG dan ENV agar process.env terbaca saat npm run build
# UserInterface/Dockerfile

FROM node:18-alpine AS builder

WORKDIR /app

# ✅ FIX: Deklarasi ARG untuk menerima nilai dari docker-compose args
ARG REACT_APP_USER_SERVICE_URL=http://localhost:8001
ARG REACT_APP_PRODUCT_SERVICE_URL=http://localhost:8002
ARG REACT_APP_ORDER_SERVICE_URL=http://localhost:8003

# ✅ FIX: Set ENV agar React bisa baca saat build time (npm run build)
ENV REACT_APP_USER_SERVICE_URL=$REACT_APP_USER_SERVICE_URL
ENV REACT_APP_PRODUCT_SERVICE_URL=$REACT_APP_PRODUCT_SERVICE_URL
ENV REACT_APP_ORDER_SERVICE_URL=$REACT_APP_ORDER_SERVICE_URL

COPY package*.json ./
RUN npm install

COPY . .

# Build production — env vars sudah tertanam di bundle JS
RUN npm run build

# Stage 2: Serve dengan Nginx
FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html

RUN printf 'server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
