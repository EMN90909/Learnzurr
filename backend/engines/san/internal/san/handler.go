package san

import "net/http"
func Name() string { return "san" }
func Handler(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }
