package main

import (
  "net/http"
  "os"
  "time"
)

func NewServer(handler http.Handler) *http.Server {
  port := os.Getenv("API_PORT")
  if port == "" { port = "8080" }
  return &http.Server{Addr: ":"+port, Handler: handler, ReadTimeout: 15*time.Second, WriteTimeout: 20*time.Second, IdleTimeout: 60*time.Second, MaxHeaderBytes: 1 << 20}
}
