package main

import (
	"net"
	"net/http"
	"os"
	"time"
)

const (
	defaultAPIPort    = "8080"
	readHeaderTimeout = 5 * time.Second
	readTimeout       = 15 * time.Second
	writeTimeout      = 30 * time.Second
	idleTimeout       = 60 * time.Second
	maxHeaderBytes    = 1 << 20
	requestTimeout    = 30 * time.Second
)

var optimizedTransport = &http.Transport{
	Proxy:                 http.ProxyFromEnvironment,
	DialContext:           (&net.Dialer{Timeout: 5 * time.Second, KeepAlive: 30 * time.Second}).DialContext,
	MaxIdleConns:          200,
	MaxIdleConnsPerHost:   50,
	IdleConnTimeout:       90 * time.Second,
	TLSHandshakeTimeout:   10 * time.Second,
	ExpectContinueTimeout: 1 * time.Second,
}

func newServer(handler http.Handler) *http.Server {
	port := os.Getenv("API_PORT")
	if port == "" {
		port = defaultAPIPort
	}
	bounded := http.TimeoutHandler(handler, requestTimeout, `{"error":"request timeout"}`)
	return &http.Server{
		Addr:              ":" + port,
		Handler:           bounded,
		ReadHeaderTimeout: readHeaderTimeout,
		ReadTimeout:       readTimeout,
		WriteTimeout:      writeTimeout,
		IdleTimeout:       idleTimeout,
		MaxHeaderBytes:    maxHeaderBytes,
	}
}
