FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
COPY svelte.config.js vite.config.ts tsconfig.json ./
COPY src ./src
RUN npm install && npm run build
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/build ./build
COPY package.json ./package.json
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build"]
