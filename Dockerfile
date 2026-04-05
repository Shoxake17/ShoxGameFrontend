# 1-bosqich: Build (Qurish) jarayoni
FROM node:20-alpine AS build

# Build argumentlarini e'lon qilamiz (GitHub Actions-dan keladi)
# ShoxGame uchun kerakli o'zgaruvchilarni shu yerga qo'shing
ARG VITE_BACKEND_URL
ARG VITE_SHOXPAY_URL
ARG VITE_GAME_MODE

# Build vaqtida Vite ushbu o'zgaruvchilarni ko'rishi uchun ENV-ga yuklaymiz
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_SHOXPAY_URL=$VITE_SHOXPAY_URL
ENV VITE_GAME_MODE=$VITE_GAME_MODE

WORKDIR /app

# Keshni optimallashtirish uchun avval packagelarni o'rnatamiz
COPY package*.json ./
RUN npm install

# Loyiha kodlarini nusxalaymiz
COPY . .

# Static fayllarni build qilamiz
RUN npm run build

# 2-bosqich: Nginx orqali xizmat ko'rsatish (Production)
FROM nginx:stable-alpine

# Build qilingan fayllarni Nginx papkasiga o'tkazamiz
COPY --from=build /app/dist /usr/share/nginx/html

# SPA (Single Page Application) uchun yo'naltirish:
# Agar foydalanuvchi sahifani yangilasa (refresh), 404 chiqmasligi uchun 
# index.html-ni 404.html sifatida ham nusxalaymiz (sodda yechim)
COPY --from=build /app/dist/index.html /usr/share/nginx/html/404.html

# Nginx portini ochamiz
EXPOSE 80

# Nginx-ni ishga tushiramiz
CMD ["nginx", "-g", "daemon off;"]