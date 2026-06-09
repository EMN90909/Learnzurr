package notify

import "net/http"
func Name() string { return "notify" }
func Handler(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
