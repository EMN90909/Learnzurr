package classroom

import "net/http"
func Name() string { return "classroom" }
func Handler(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
