# Learnzur single-container production image.
# Runs:
#   - Go API on internal API_PORT, default 8080
#   - SvelteKit Node server on internal FRONTEND_PORT, default 3000
#   - Node reverse proxy on public PORT, default 10000
# Public traffic:
#   /api/* -> Go API
#   /*     -> SvelteKit SSR frontend

FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
ENV PUBLIC_API_BASE_URL=/api
RUN npm run build

FROM golang:1.23-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags='-s -w' -o /out/learnzur-api ./cmd/api \
  && CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags='-s -w' -o /out/learnzur-worker ./cmd/worker \
  && for e in gamfy mearn lms classroom san lanmat notify media find flag; do \
       CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags='-s -w' -o /out/learnzur-$e ./engines/$e/cmd/$e; \
     done

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
ENV FRONTEND_PORT=3000
ENV API_PORT=8080
ENV HOST=0.0.0.0
RUN apk add --no-cache ca-certificates tini \
  && addgroup -S learnzur \
  && adduser -S learnzur -G learnzur

COPY --from=frontend-builder /app/frontend/build ./frontend/build
COPY --from=frontend-builder /app/frontend/package.json ./frontend/package.json
COPY --from=backend-builder /out/learnzur-api /usr/local/bin/learnzur-api
COPY --from=backend-builder /out/learnzur-worker /usr/local/bin/learnzur-worker
COPY --from=backend-builder /out/learnzur-gamfy /usr/local/bin/learnzur-gamfy
COPY --from=backend-builder /out/learnzur-mearn /usr/local/bin/learnzur-mearn
COPY --from=backend-builder /out/learnzur-lms /usr/local/bin/learnzur-lms
COPY --from=backend-builder /out/learnzur-classroom /usr/local/bin/learnzur-classroom
COPY --from=backend-builder /out/learnzur-san /usr/local/bin/learnzur-san
COPY --from=backend-builder /out/learnzur-lanmat /usr/local/bin/learnzur-lanmat
COPY --from=backend-builder /out/learnzur-notify /usr/local/bin/learnzur-notify
COPY --from=backend-builder /out/learnzur-media /usr/local/bin/learnzur-media
COPY --from=backend-builder /out/learnzur-find /usr/local/bin/learnzur-find
COPY --from=backend-builder /out/learnzur-flag /usr/local/bin/learnzur-flag
COPY scripts/start-production.mjs ./scripts/start-production.mjs

USER learnzur
EXPOSE 10000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "scripts/start-production.mjs"]
