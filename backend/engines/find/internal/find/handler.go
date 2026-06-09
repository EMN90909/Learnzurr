package find

import "net/http"
func Name() string { return "find" }
func Handler(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
