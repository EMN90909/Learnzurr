package gamfy

import "net/http"
func Name() string { return "gamfy" }
func Handler(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
