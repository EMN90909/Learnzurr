package mearn

import "net/http"
func Name() string { return "mearn" }
func Handler(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
