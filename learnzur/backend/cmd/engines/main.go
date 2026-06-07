package main

import (
	"learnzur/backend/internal/middleware"
	"log"
	"net/http"
	"os"
)

func main() {
	engine := os.Getenv("LEARNZUR_ENGINE")
	if engine == "" {
		engine = "all"
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		middleware.JSON(w, 200, map[string]string{"ok": "true", "engine": engine})
	})
	log.Fatal(http.ListenAndServe(":8090", mux))
}
