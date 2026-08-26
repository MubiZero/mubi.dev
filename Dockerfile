FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
# The build needs astro and its integrations, nothing from the test toolchain.
RUN npm ci --omit=dev

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
