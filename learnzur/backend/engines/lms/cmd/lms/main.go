package main

import (
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write([]byte("lms:ok")) })
	log.Fatal(http.ListenAndServe(":8090", nil))
}
