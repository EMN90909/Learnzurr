FROM node:20-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN mkdir -p public && printf 'window.__STRUTA_ENV__ = {};\n' > public/env.js
RUN pnpm run build
EXPOSE 8081
CMD ["sh", "-c", "pnpm start"]
