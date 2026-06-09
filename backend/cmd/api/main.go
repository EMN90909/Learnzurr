package main

import (
  "log"
  "net/http"
  "os"
)

func main() {
  port := os.Getenv("API_PORT")
  if port == "" { port = "8080" }
  srv := NewServer(BuildRoutes())
  log.Printf("learnzur api listening on :%s", port)
  if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed { log.Fatal(err) }
}
