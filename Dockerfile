FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
# The build needs astro and its integrations, nothing from the test toolchain.
RUN npm ci --omit=dev

COPY . .

# Optional. The build reads GitHub for the repository facts the code section
# states, and an anonymous call gets 60 requests an hour per address, which a
# shared build host runs through quickly; a token raises that to 5000. Without
# one the build still succeeds on the committed snapshot, only staler. Passed
# to the one command that needs it rather than set as ENV, so it stays out of
# the image's environment.
ARG GITHUB_TOKEN=""
RUN GITHUB_TOKEN="$GITHUB_TOKEN" npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
