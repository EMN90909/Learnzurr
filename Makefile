SHELL := /bin/bash
.PHONY: test backend frontend build docker
backend:
	cd backend && go test ./...
frontend:
	cd frontend && npm install && npm run check && npm run build
test: backend frontend
build:
	docker compose build
docker:
	docker compose up --build
