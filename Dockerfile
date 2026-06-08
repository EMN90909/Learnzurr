FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json ./package.json
COPY frontend/svelte.config.js frontend/vite.config.ts frontend/tsconfig.json ./
COPY frontend/static ./static
COPY frontend/src ./src
RUN npm install && npm run build

FROM golang:1.22-alpine AS backend
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
COPY backend ./
RUN go build -o /out/api ./cmd/api && go build -o /out/worker ./cmd/worker

FROM alpine:3.20
RUN apk add --no-cache nginx nodejs npm ca-certificates bash
WORKDIR /app
COPY --from=frontend /app/frontend /app/frontend
COPY --from=backend /out/api /app/api
COPY --from=backend /out/worker /app/worker
COPY docker/nginx.single.conf /etc/nginx/http.d/default.conf
COPY scripts/start-all.sh /app/start-all.sh
RUN chmod +x /app/start-all.sh
EXPOSE 8080
CMD ["/app/start-all.sh"]
