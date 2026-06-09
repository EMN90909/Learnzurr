package media

import "net/http"
func Name() string { return "media" }
func Handler(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
