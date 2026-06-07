package lms

import (
	"encoding/json"
	"net/http"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	_ = json.NewEncoder(w).Encode(NewService().Health())
}
