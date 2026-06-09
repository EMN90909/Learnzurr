package lms

import "net/http"
func Name() string { return "lms" }
func Handler(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
