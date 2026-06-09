package flagengine

import "net/http"
func Name() string { return "flag" }
func Handler(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
