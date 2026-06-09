package lanmat

import "net/http"
func Name() string { return "lanmat" }
func Handler(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
